using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wishlist.Commands.ClearWishlist;

public record ClearWishlistCommand : IRequest<ApiResponse<Unit>>
{
}

public class ClearWishlistCommandHandler : IRequestHandler<ClearWishlistCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ClearWishlistCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(ClearWishlistCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var wishlistItems = await _context.WishlistItems
            .Where(w => w.UserId == userId && w.IsActive)
            .ToListAsync(cancellationToken);

        if (wishlistItems.Any())
        {
            _context.WishlistItems.RemoveRange(wishlistItems);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Wishlist cleared successfully.");
    }
}
