using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Orders.Commands.AcceptSellerRequest;

public record AcceptSellerRequestCommand : IRequest<ApiResponse<Guid>>
{
    public Guid SellerRequestId { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryNotes { get; set; }
}

public class AcceptSellerRequestCommandValidator : AbstractValidator<AcceptSellerRequestCommand>
{
    public AcceptSellerRequestCommandValidator()
    {
        RuleFor(v => v.SellerRequestId)
            .NotEmpty().WithMessage("Seller request ID is required.");
    }
}

public class AcceptSellerRequestCommandHandler : IRequestHandler<AcceptSellerRequestCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AcceptSellerRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Guid>> Handle(AcceptSellerRequestCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
        }

        var buyerId = _currentUserService.UserId;

        // Get the seller request (order where BuyerId == SellerId)
        var sellerRequest = await _context.Orders
            .Include(o => o.Escrow)
            .FirstOrDefaultAsync(o => o.Id == request.SellerRequestId && 
                                    o.BuyerId == o.SellerId && 
                                    o.Status == OrderStatus.Created, 
                                    cancellationToken);

        if (sellerRequest == null)
        {
            return ApiResponse<Guid>.FailureResponse("Seller request not found or no longer available");
        }

        var sellerId = sellerRequest.SellerId;

        // Verify buyer and seller are different
        if (buyerId == sellerId)
        {
            return ApiResponse<Guid>.FailureResponse("You cannot accept your own seller request");
        }

        // Create new escrow for the actual order
        var escrow = new Escrow(
            new Money(sellerRequest.Amount.Amount, sellerRequest.Amount.Currency),
            buyerId,
            sellerId,
            sellerRequest.Title,
            sellerRequest.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        // Create the actual order
        var order = new Order(
            buyerId,
            sellerId,
            escrow.Id,
            sellerRequest.Title,
            sellerRequest.Description,
            new Money(sellerRequest.Amount.Amount, sellerRequest.Amount.Currency),
            sellerRequest.ImageUrls);

        // Set delivery details if provided
        if (!string.IsNullOrEmpty(request.DeliveryAddress))
        {
            order.SetDeliveryAddress(request.DeliveryAddress, request.DeliveryNotes);
        }

        _context.Orders.Add(order);
        
        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        
        // Mark the original seller request as taken/completed
        // so it doesn't appear in available requests anymore
        sellerRequest.CancelOrder();
        
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Guid>.SuccessResponse(order.Id, "Order created successfully from seller request. The seller has been notified.");
    }
}