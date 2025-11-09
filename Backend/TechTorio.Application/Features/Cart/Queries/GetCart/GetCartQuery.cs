using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Cart.Queries.GetCart;

public record GetCartQuery : IRequest<ApiResponse<CartDto>>
{
}

public record CartDto
{
    public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    public decimal SubTotal { get; set; }
    public int TotalItems { get; set; }
    public string Currency { get; set; } = "PKR";
}

public record CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public int MaxOrderQuantity { get; set; }
    public int MinOrderQuantity { get; set; }
    public int StockQuantity { get; set; }
    public bool AllowBackorders { get; set; }
    public DateTime AddedDate { get; set; }
    public DateTime LastUpdated { get; set; }
    
    // Seller information
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    
    // Product availability
    public bool IsAvailable { get; set; }
    public string? UnavailabilityReason { get; set; }
}

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, ApiResponse<CartDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCartQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<CartDto>> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var cartItems = await _context.CartItems
            .Include(ci => ci.Product)
                .ThenInclude(p => p.ProductImages.Where(img => img.IsPrimary))
            .Include(ci => ci.Product.Seller)
            .Where(ci => ci.UserId == userId)
            .Select(ci => new CartItemDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                ProductSku = ci.Product.Sku,
                ProductImageUrl = ci.Product.ProductImages.FirstOrDefault(img => img.IsPrimary) != null 
                    ? ci.Product.ProductImages.First(img => img.IsPrimary).ImageUrl 
                    : ci.Product.ProductImages.FirstOrDefault() != null 
                        ? ci.Product.ProductImages.First().ImageUrl 
                        : null,
                UnitPrice = ci.UnitPrice.Amount,
                Currency = ci.UnitPrice.Currency,
                Quantity = ci.Quantity,
                TotalPrice = ci.UnitPrice.Amount * ci.Quantity,
                MaxOrderQuantity = ci.Product.MaxOrderQuantity,
                MinOrderQuantity = ci.Product.MinOrderQuantity,
                StockQuantity = ci.Product.StockQuantity,
                AllowBackorders = ci.Product.AllowBackorders,
                AddedDate = ci.AddedDate,
                LastUpdated = ci.LastUpdated,
                SellerId = ci.Product.SellerId,
                SellerName = ci.Product.Seller.FirstName + " " + ci.Product.Seller.LastName,
                IsAvailable = ci.Product.IsActive && 
                             ci.Product.Status == Domain.Enums.ProductStatus.Active &&
                             (ci.Product.StockQuantity >= ci.Quantity || ci.Product.AllowBackorders),
                UnavailabilityReason = !ci.Product.IsActive ? "Product no longer available" :
                                     ci.Product.Status != Domain.Enums.ProductStatus.Active ? "Product not active" :
                                     ci.Product.StockQuantity < ci.Quantity && !ci.Product.AllowBackorders ? "Insufficient stock" : null
            })
            .OrderBy(ci => ci.LastUpdated)
            .ToListAsync(cancellationToken);

        var cart = new CartDto
        {
            Items = cartItems,
            SubTotal = cartItems.Where(ci => ci.IsAvailable).Sum(ci => ci.TotalPrice),
            TotalItems = cartItems.Sum(ci => ci.Quantity),
            Currency = cartItems.FirstOrDefault()?.Currency ?? "PKR"
        };

        return ApiResponse<CartDto>.SuccessResponse(cart);
    }
}