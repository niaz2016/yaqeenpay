using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand : IRequest<ApiResponse<Guid>>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public Guid SellerId { get; set; }
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

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
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
            new Money(request.Amount, request.Currency));

        _context.Orders.Add(order);
        
        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Guid>.SuccessResponse(order.Id, "Order created successfully");
    }
}