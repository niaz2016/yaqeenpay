using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Cart.Commands.UpdateCartItem;

public record UpdateCartItemCommand : IRequest<ApiResponse<Unit>>
{
    public Guid CartItemId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemCommandValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemCommandValidator()
    {
        RuleFor(v => v.CartItemId)
            .NotEmpty().WithMessage("Cart item ID is required.");

        RuleFor(v => v.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}

public class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCartItemCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var cartItem = await _context.CartItems
            .Include(ci => ci.Product)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.UserId == userId, cancellationToken);

        if (cartItem == null)
        {
            return ApiResponse<Unit>.FailureResponse("Cart item not found.");
        }

        // Check if product is still available
        if (!cartItem.Product.IsActive || cartItem.Product.Status != Domain.Enums.ProductStatus.Active)
        {
            return ApiResponse<Unit>.FailureResponse("Product is no longer available.");
        }

        // Check if the requested quantity is valid
        if (!cartItem.Product.CanOrderQuantity(request.Quantity))
        {
            return ApiResponse<Unit>.FailureResponse($"Invalid quantity. Minimum: {cartItem.Product.MinOrderQuantity}, Maximum: {cartItem.Product.MaxOrderQuantity}, Available: {cartItem.Product.StockQuantity}");
        }

        // Update the cart item
        cartItem.UpdateQuantity(request.Quantity);
        cartItem.UpdatePrice(cartItem.Product.GetEffectivePrice());

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Cart item updated successfully.");
    }
}