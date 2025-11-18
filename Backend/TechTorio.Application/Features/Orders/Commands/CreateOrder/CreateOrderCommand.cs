using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Application.Interfaces;
using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;

namespace TechTorio.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand : IRequest<ApiResponse<Guid>>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PKR";
    public Guid SellerId { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(v => v.Currency)
            .NotEmpty().WithMessage("Currency is required.");

        RuleFor(v => v.SellerId)
            .NotEmpty().WithMessage("Seller ID is required.");
    }
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly TechTorio.Application.Interfaces.IOrderNotificationService _orderNotificationService;

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        TechTorio.Application.Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
        }

        // Check if buyer's phone number is verified
        var buyer = await _context.Users.FindAsync(new object[] { _currentUserService.UserId }, cancellationToken);
        if (buyer == null)
        {
            return ApiResponse<Guid>.FailureResponse("Buyer not found");
        }
        
        if (!buyer.IsPhoneVerified)
        {
            return ApiResponse<Guid>.FailureResponse("Phone number must be verified before placing an order");
        }

        // Check if seller exists
        var sellerExists = await _context.Users
            .AnyAsync(u => u.Id == request.SellerId, cancellationToken);

        if (!sellerExists)
        {
            return ApiResponse<Guid>.FailureResponse("Seller not found");
        }

        // Create new order
        var escrow = new Escrow(
            new Money(request.Amount, request.Currency),
            _currentUserService.UserId,
            request.SellerId,
            request.Title,
            request.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        var order = new Order(
            _currentUserService.UserId,
            request.SellerId,
            escrow.Id,
            request.Title,
            request.Description,
            new Money(request.Amount, request.Currency),
            request.ImageUrls);

        _context.Orders.Add(order);

        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        await _context.SaveChangesAsync(cancellationToken);

        // Check buyer wallet and set payment pending if insufficient
        try
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == _currentUserService.UserId, cancellationToken);
            if (wallet == null || !wallet.HasSufficientFunds(order.Amount))
            {
                order.MarkPaymentPending();
                await _context.SaveChangesAsync(cancellationToken);

                // Notify buyer and seller about pending payment
                await _orderNotificationService.NotifyPaymentPending(order);
            }
        }
        catch
        {
            // Do not fail order creation on notification or wallet-check errors
        }

        return ApiResponse<Guid>.SuccessResponse(order.Id, "Order created successfully");
    }
}