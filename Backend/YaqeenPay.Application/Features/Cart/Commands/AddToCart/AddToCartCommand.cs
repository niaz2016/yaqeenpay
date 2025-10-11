using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Cart.Commands.AddToCart;

public record AddToCartCommand : IRequest<ApiResponse<Unit>>
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class AddToCartCommandValidator : AbstractValidator<AddToCartCommand>
{
    public AddToCartCommandValidator()
    {
        RuleFor(v => v.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(v => v.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}

public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddToCartCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        // Check if product exists and is available
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && 
                                    p.Status == ProductStatus.Active && 
                                    p.IsActive, cancellationToken);

        if (product == null)
        {
            return ApiResponse<Unit>.FailureResponse("Product not found or is not available.");
        }

        // Check if user is trying to add their own product to cart
        if (product.SellerId == userId)
        {
            return ApiResponse<Unit>.FailureResponse("You cannot add your own product to cart.");
        }

        // Check if product can fulfill the requested quantity
        if (!product.CanOrderQuantity(request.Quantity))
        {
            return ApiResponse<Unit>.FailureResponse($"Invalid quantity. Minimum: {product.MinOrderQuantity}, Maximum: {product.MaxOrderQuantity}, Available: {product.StockQuantity}");
        }

        // Check if item already exists in cart
        var existingCartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == request.ProductId, cancellationToken);

        if (existingCartItem != null)
        {
            // Update existing cart item quantity
            var newQuantity = existingCartItem.Quantity + request.Quantity;
            
            if (!product.CanOrderQuantity(newQuantity))
            {
                return ApiResponse<Unit>.FailureResponse($"Cannot add {request.Quantity} more items. Current cart quantity: {existingCartItem.Quantity}, Maximum allowed: {product.MaxOrderQuantity}");
            }

            existingCartItem.UpdateQuantity(newQuantity);
            existingCartItem.UpdatePrice(product.GetEffectivePrice());
        }
        else
        {
            // Create new cart item
            var cartItem = new CartItem(
                userId,
                request.ProductId,
                request.Quantity,
                product.GetEffectivePrice());

            _context.CartItems.Add(cartItem);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product added to cart successfully.");
    }
}