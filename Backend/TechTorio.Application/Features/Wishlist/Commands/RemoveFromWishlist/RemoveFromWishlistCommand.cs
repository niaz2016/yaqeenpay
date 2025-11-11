using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wishlist.Commands.RemoveFromWishlist;

public record RemoveFromWishlistCommand : IRequest<ApiResponse<Unit>>
{
    public Guid ProductId { get; set; }
}

public class RemoveFromWishlistCommandValidator : AbstractValidator<RemoveFromWishlistCommand>
{
    public RemoveFromWishlistCommandValidator()
    {
        RuleFor(v => v.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");
    }
}

public class RemoveFromWishlistCommandHandler : IRequestHandler<RemoveFromWishlistCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RemoveFromWishlistCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(RemoveFromWishlistCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var wishlistItem = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && 
                                    w.ProductId == request.ProductId &&
                                    w.IsActive, cancellationToken);

        if (wishlistItem == null)
        {
            return ApiResponse<Unit>.FailureResponse("Item not found in wishlist.");
        }

        _context.WishlistItems.Remove(wishlistItem);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product removed from wishlist.");
    }
}
