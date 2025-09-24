using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.CreateSellerRequest;

public record CreateSellerRequestCommand : IRequest<ApiResponse<Guid>>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class CreateSellerRequestCommandValidator : AbstractValidator<CreateSellerRequestCommand>
{
    public CreateSellerRequestCommandValidator()
    {
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(v => v.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(v => v.Currency)
            .NotEmpty().WithMessage("Currency is required.");

        // Removed requirement for at least one image to allow seller requests without images
    }
}

public class CreateSellerRequestCommandHandler : IRequestHandler<CreateSellerRequestCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateSellerRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateSellerRequestCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
        }

        // For seller requests, the seller creates an order without a specific buyer
        // The buyerId will be set to the seller's ID temporarily, and updated when a buyer accepts
        var sellerId = _currentUserService.UserId;

        // Create new escrow for the seller request (will be funded when buyer accepts)
        var escrow = new Escrow(
            new Money(request.Amount, request.Currency),
            sellerId, // Temporary buyer ID (will be updated when actual buyer accepts)
            sellerId,
            request.Title,
            request.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        // Create the seller order request
        var order = new Order(
            sellerId, // Temporary buyer ID
            sellerId,
            escrow.Id,
            request.Title,
            request.Description,
            new Money(request.Amount, request.Currency),
            request.ImageUrls);

        // Mark as seller request (we can add a status or property for this)
        // For now, we'll use the existing status but could add IsSellerRequest property

        _context.Orders.Add(order);
        
        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Guid>.SuccessResponse(order.Id, "Seller request created successfully. Buyers can now create orders with you.");
    }
}