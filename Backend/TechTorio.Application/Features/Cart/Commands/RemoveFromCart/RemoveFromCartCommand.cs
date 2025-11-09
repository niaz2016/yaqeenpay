using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Cart.Commands.RemoveFromCart;

public record RemoveFromCartCommand : IRequest<ApiResponse<Unit>>
{
    public Guid CartItemId { get; set; }
}

public class RemoveFromCartCommandValidator : AbstractValidator<RemoveFromCartCommand>
{
    public RemoveFromCartCommandValidator()
    {
        RuleFor(v => v.CartItemId)
            .NotEmpty().WithMessage("Cart item ID is required.");
    }
}

public class RemoveFromCartCommandHandler : IRequestHandler<RemoveFromCartCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RemoveFromCartCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(RemoveFromCartCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.UserId == userId, cancellationToken);

        if (cartItem == null)
        {
            return ApiResponse<Unit>.FailureResponse("Cart item not found.");
        }

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Item removed from cart successfully.");
    }
}