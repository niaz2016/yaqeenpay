using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Application.Features.Products.Queries.GetSellerProducts;

namespace YaqeenPay.Application.Features.Products.Queries.GetProductById;

public record GetProductByIdQuery : IRequest<ApiResponse<GetSellerProducts.ProductDto>>
{
    public Guid Id { get; set; }
}

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ApiResponse<GetSellerProducts.ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetProductByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<GetSellerProducts.ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        // Do not filter by IsActive here so the owner/admin can retrieve even inactive/soft-deleted products for editing
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages.OrderBy(img => img.SortOrder))
            .Include(p => p.Seller)
                .ThenInclude(s => s.BusinessProfile)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
        {
            return ApiResponse<GetSellerProducts.ProductDto>.FailureResponse("Product not found.");
        }

        // Check if the current user is the seller of this product or an admin
        var currentUserId = _currentUserService.UserId;
        if (currentUserId != product.SellerId && !_currentUserService.IsInRole("Admin"))
        {
            // For non-owners, only return active and public (IsActive) products
            if (product.Status != ProductStatus.Active || !product.IsActive)
            {
                return ApiResponse<GetSellerProducts.ProductDto>.FailureResponse("Product not found.");
            }
        }

        var productDto = new GetSellerProducts.ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            ShortDescription = product.ShortDescription,
            Price = product.Price.Amount,
            Currency = product.Price.Currency,
            DiscountPrice = product.DiscountPrice?.Amount,
            Sku = product.Sku,
            StockQuantity = product.StockQuantity,
            Status = product.Status,
            CreatedAt = product.CreatedAt,
            Category = new GetSellerProducts.CategoryDto
            {
                Id = product.Category.Id,
                Name = product.Category.Name,
                Description = product.Category.Description
            },
            Seller = product.Seller.BusinessProfile != null ? new GetSellerProducts.SellerDto
            {
                Id = product.Seller.Id,
                BusinessName = product.Seller.BusinessProfile.BusinessName,
                PhoneNumber = product.Seller.PhoneNumber ?? string.Empty
            } : null,
            Images = product.ProductImages.Select(img => new GetSellerProducts.ProductImageDto
            {
                ImageUrl = img.ImageUrl,
                AltText = img.AltText ?? string.Empty,
                SortOrder = img.SortOrder,
                IsPrimary = img.IsPrimary
            }).ToList(),
            Attributes = product.Attributes?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>(),
            Tags = product.Tags?.ToList() ?? new List<string>(),
            Brand = product.Brand,
            Model = product.Model,
            Color = product.Color,
            Size = product.Size,
            Material = product.Material,
            Weight = product.Weight,
            WeightUnit = product.WeightUnit,
            Dimensions = product.Dimensions,
            MinOrderQuantity = product.MinOrderQuantity,
            MaxOrderQuantity = product.MaxOrderQuantity,
            AllowBackorders = product.AllowBackorders,
            ViewCount = product.ViewCount,
            AverageRating = product.AverageRating,
            ReviewCount = product.ReviewCount
        };

        // Populate variants
        productDto.Variants = product.Variants?.Select(v => new GetSellerProducts.ProductVariantDto
        {
            Id = v.Id,
            Size = v.Size,
            Color = v.Color,
            Price = v.Price,
            StockQuantity = v.StockQuantity,
            Sku = v.Sku
        }).ToList() ?? new List<GetSellerProducts.ProductVariantDto>();

        // Populate FAQs
        productDto.Faqs = product.Faqs?.Select(f => new GetSellerProducts.ProductFaqDto
        {
            Question = f.Question,
            Answer = f.Answer
        }).ToList() ?? new List<GetSellerProducts.ProductFaqDto>();

        return ApiResponse<GetSellerProducts.ProductDto>.SuccessResponse(productDto, "Product retrieved successfully.");
    }
}