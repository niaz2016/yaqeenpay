using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wishlist.Queries.GetWishlist;

public record GetWishlistQuery : IRequest<ApiResponse<List<WishlistItemDto>>>
{
}

public class WishlistItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public decimal Price { get; set; }
    public DateTime AddedDate { get; set; }
    public bool IsAvailable { get; set; }
}

public class GetWishlistQueryHandler : IRequestHandler<GetWishlistQuery, ApiResponse<List<WishlistItemDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWishlistQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<List<WishlistItemDto>>> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var wishlistItems = await _context.WishlistItems
            .Where(w => w.UserId == userId && w.IsActive)
            .Include(w => w.Product)
                .ThenInclude(p => p.ProductImages)
            .Select(w => new WishlistItemDto
            {
                ProductId = w.ProductId,
                ProductName = w.Product.Name,
                ProductImage = w.Product.ProductImages.OrderByDescending(img => img.IsPrimary).Select(img => img.ImageUrl).FirstOrDefault(),
                Price = w.Product.Price.Amount,
                AddedDate = w.AddedDate,
                IsAvailable = w.Product.IsActive && w.Product.Status == Domain.Enums.ProductStatus.Active
            })
            .OrderByDescending(w => w.AddedDate)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<WishlistItemDto>>.SuccessResponse(wishlistItems);
    }
}
