using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.Products.Queries.GetSellerProducts;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Products.Queries.GetProducts;

public record GetProductsQuery : IRequest<ApiResponse<PagedList<ProductDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? SellerId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Brand { get; set; }
    public string? Color { get; set; }
    public string? Size { get; set; }
    public List<string>? Tags { get; set; }
    public bool? InStockOnly { get; set; }
    public bool? OnSaleOnly { get; set; }
    public bool? FeaturedOnly { get; set; }
    public string? SortBy { get; set; } = "Name";
    public bool SortDescending { get; set; } = false;
}

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, ApiResponse<PagedList<ProductDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedList<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages.OrderBy(img => img.SortOrder))
            .Include(p => p.Seller)
                .ThenInclude(s => s.BusinessProfile)
            .AsNoTracking() // Read-only query - no change tracking needed
            .AsSplitQuery() // Prevent cartesian explosion with multiple includes
            .Where(p => p.Status == ProductStatus.Active && p.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.ToLower();
            // Search in Name, Description, and Brand only
            // Tags are handled separately below to avoid LINQ translation issues
            query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                   p.Description.ToLower().Contains(searchTerm) ||
                                   (p.Brand != null && p.Brand.ToLower().Contains(searchTerm)));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        if (request.SellerId.HasValue)
        {
            query = query.Where(p => p.SellerId == request.SellerId.Value);
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(p => (p.DiscountPrice != null ? p.DiscountPrice.Amount : p.Price.Amount) >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => (p.DiscountPrice != null ? p.DiscountPrice.Amount : p.Price.Amount) <= request.MaxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Brand))
        {
            query = query.Where(p => p.Brand != null && p.Brand.ToLower().Contains(request.Brand.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            query = query.Where(p => p.Color != null && p.Color.ToLower().Contains(request.Color.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(request.Size))
        {
            query = query.Where(p => p.Size != null && p.Size.ToLower().Contains(request.Size.ToLower()));
        }

        // Note: Tag filtering is not supported in this query due to PostgreSQL/EF Core LINQ translation limitations
        // Tags are still returned in the results and can be filtered client-side if needed
        // For tag-specific searches, products should have tag keywords in their Name, Description, or Brand fields

        if (request.InStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity > 0 || p.AllowBackorders);
        }

        if (request.OnSaleOnly == true)
        {
            query = query.Where(p => p.DiscountPrice != null);
        }

        if (request.FeaturedOnly == true)
        {
            query = query.Where(p => p.IsFeatured && (p.FeaturedUntil == null || p.FeaturedUntil > DateTime.UtcNow));
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "price" => request.SortDescending ? 
                query.OrderByDescending(p => p.DiscountPrice != null ? p.DiscountPrice.Amount : p.Price.Amount) : 
                query.OrderBy(p => p.DiscountPrice != null ? p.DiscountPrice.Amount : p.Price.Amount),
            "rating" => request.SortDescending ? query.OrderByDescending(p => p.AverageRating) : query.OrderBy(p => p.AverageRating),
            "views" => request.SortDescending ? query.OrderByDescending(p => p.ViewCount) : query.OrderBy(p => p.ViewCount),
            "created" => request.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "featured" => query.OrderByDescending(p => p.IsFeatured).ThenBy(p => p.Name),
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
                }).ToList(),
                Seller = p.Seller != null ? new SellerDto
                {
                    Id = p.Seller.Id,
                    BusinessName = p.Seller.BusinessProfile != null ? p.Seller.BusinessProfile.BusinessName : string.Empty,
                    PhoneNumber = p.Seller.PhoneNumber
                } : null
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedList<ProductDto>(products, totalCount, request.Page, request.PageSize);

        return ApiResponse<PagedList<ProductDto>>.SuccessResponse(pagedResult);
    }
}