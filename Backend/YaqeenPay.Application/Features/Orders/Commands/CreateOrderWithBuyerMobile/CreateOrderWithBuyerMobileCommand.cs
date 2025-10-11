using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.CreateOrderWithBuyerMobile;

public record CreateOrderWithBuyerMobileCommand : IRequest<ApiResponse<Guid>>
{
    public string BuyerMobileNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PKR";
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class CreateOrderWithBuyerMobileCommandValidator : AbstractValidator<CreateOrderWithBuyerMobileCommand>
{
    private readonly IUserLookupService _userLookupService;

    public CreateOrderWithBuyerMobileCommandValidator(IUserLookupService userLookupService)
    {
        _userLookupService = userLookupService;

        RuleFor(x => x.BuyerMobileNumber)
            .NotEmpty()
            .WithMessage("Buyer mobile number is required")
            .MustAsync(async (mobile, cancellationToken) =>
            {
                var user = await _userLookupService.GetUserByPhoneNumberAsync(mobile);
                return user != null;
            })
            .WithMessage("No buyer found with this mobile number");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required")
            .MaximumLength(200)
            .WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(1000)
            .WithMessage("Description must not exceed 1000 characters");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than 0");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .WithMessage("Currency is required");
    }
}

public class CreateOrderWithBuyerMobileCommandHandler : IRequestHandler<CreateOrderWithBuyerMobileCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserLookupService _userLookupService;
    private readonly YaqeenPay.Application.Interfaces.IOrderNotificationService _orderNotificationService;

    public CreateOrderWithBuyerMobileCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IUserLookupService userLookupService,
        YaqeenPay.Application.Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _userLookupService = userLookupService;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateOrderWithBuyerMobileCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
        }

        // Look up buyer by mobile number
        var buyer = await _userLookupService.GetUserByPhoneNumberAsync(request.BuyerMobileNumber);
        if (buyer == null)
        {
            return ApiResponse<Guid>.FailureResponse($"No buyer found with mobile number {request.BuyerMobileNumber}");
        }

        var sellerId = _currentUserService.UserId;
        var buyerId = buyer.Id;

        // Verify seller and buyer are different
        if (sellerId == buyerId)
        {
            return ApiResponse<Guid>.FailureResponse("You cannot create an order with yourself as the buyer");
        }

        // Create new escrow for this order
        var escrow = new Escrow(
            new Money(request.Amount, request.Currency),
            buyerId,
            sellerId,
            request.Title,
            request.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        // Create the order
        var order = new Order(
            buyerId,
            sellerId,
            escrow.Id,
            request.Title,
            request.Description,
            new Money(request.Amount, request.Currency),
            request.ImageUrls);

        _context.Orders.Add(order);
        
        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        await _context.SaveChangesAsync(cancellationToken);

        System.Console.WriteLine($"CreateOrderWithBuyerMobile: Created order {order.Id} - Seller: {sellerId}, Buyer: {buyerId} (mobile: {request.BuyerMobileNumber})");

        // Send notifications to both buyer and seller
        try
        {
            await _orderNotificationService.NotifyOrderCreated(order);
        }
        catch (Exception ex)
        {
            // Log notification error but don't fail the order creation
            System.Console.WriteLine($"Failed to send order creation notifications: {ex.Message}");
        }

        return ApiResponse<Guid>.SuccessResponse(order.Id);
    }
}