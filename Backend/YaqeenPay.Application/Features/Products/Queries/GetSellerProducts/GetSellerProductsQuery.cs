using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Products.Queries.GetSellerProducts;

public record GetSellerProductsQuery : IRequest<ApiResponse<PagedList<ProductDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public ProductStatus? Status { get; set; }
    public Guid? CategoryId { get; set; }
    public string? SortBy { get; set; } = "Name";
    public bool SortDescending { get; set; } = false;
}

public record ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal? DiscountPrice { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinOrderQuantity { get; set; }
    public int MaxOrderQuantity { get; set; }
    public decimal Weight { get; set; }
    public string? WeightUnit { get; set; }
    public string? Dimensions { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public ProductStatus Status { get; set; }
    public bool IsFeatured { get; set; }
    public bool AllowBackorders { get; set; }
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public DateTime? FeaturedUntil { get; set; }
    public List<string> Tags { get; set; } = new List<string>();
    public Dictionary<string, string> Attributes { get; set; } = new Dictionary<string, string>();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    
    // Category info
    public CategoryDto Category { get; set; } = null!;
    
    // Images
    public List<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
    // Variants
    public List<ProductVariantDto> Variants { get; set; } = new List<ProductVariantDto>();
    // FAQs
    public List<ProductFaqDto> Faqs { get; set; } = new List<ProductFaqDto>();
    
    // Seller info
    public SellerDto? Seller { get; set; }
    
    // Calculated properties
    public decimal EffectivePrice => DiscountPrice ?? Price;
    public bool IsOnSale => DiscountPrice.HasValue;
    public decimal DiscountPercentage => IsOnSale ? ((Price - DiscountPrice!.Value) / Price) * 100 : 0;
    public bool IsInStock => StockQuantity > 0 || AllowBackorders;
}

public record CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public record ProductImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public record ProductFaqDto
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public record SellerDto
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class GetSellerProductsQueryHandler : IRequestHandler<GetSellerProductsQuery, ApiResponse<PagedList<ProductDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetSellerProductsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<PagedList<ProductDto>>> Handle(GetSellerProductsQuery request, CancellationToken cancellationToken)
    {
        var sellerId = _currentUserService.UserId;

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages.OrderBy(img => img.SortOrder))
            .Where(p => p.SellerId == sellerId && p.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                   p.Description.ToLower().Contains(searchTerm) ||
                                   p.Sku.ToLower().Contains(searchTerm));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(p => p.Status == request.Status.Value);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "price" => request.SortDescending ? query.OrderByDescending(p => p.Price.Amount) : query.OrderBy(p => p.Price.Amount),
            "stock" => request.SortDescending ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
            "created" => request.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        
        var products = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                ShortDescription = p.ShortDescription,
                Price = p.Price.Amount,
                Currency = p.Price.Currency,
                DiscountPrice = p.DiscountPrice != null ? p.DiscountPrice.Amount : null,
                Sku = p.Sku,
                StockQuantity = p.StockQuantity,
                MinOrderQuantity = p.MinOrderQuantity,
                MaxOrderQuantity = p.MaxOrderQuantity,
                Weight = p.Weight,
                WeightUnit = p.WeightUnit,
                Dimensions = p.Dimensions,
                Brand = p.Brand,
                Model = p.Model,
                Color = p.Color,
                Size = p.Size,
                Material = p.Material,
                Status = p.Status,
                IsFeatured = p.IsFeatured,
                AllowBackorders = p.AllowBackorders,
                ViewCount = p.ViewCount,
                AverageRating = p.AverageRating,
                ReviewCount = p.ReviewCount,
                FeaturedUntil = p.FeaturedUntil,
                Tags = p.Tags,
                Attributes = p.Attributes,
                CreatedAt = p.CreatedAt,
                LastModifiedAt = p.LastModifiedAt,
                Category = new CategoryDto
                {
                    Id = p.Category.Id,
                    Name = p.Category.Name,
                    Description = p.Category.Description,
                    ImageUrl = p.Category.ImageUrl
                },
                Images = p.ProductImages.Select(img => new ProductImageDto
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    AltText = img.AltText,
                    SortOrder = img.SortOrder,
                    IsPrimary = img.IsPrimary
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedList<ProductDto>(products, totalCount, request.Page, request.PageSize);

        return ApiResponse<PagedList<ProductDto>>.SuccessResponse(pagedResult);
    }
}

public record ProductVariantDto
{
    public Guid Id { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? Sku { get; set; }
}