using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.ValueObjects;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand : IRequest<ApiResponse<Unit>>
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "PKR";
    public decimal? DiscountPrice { get; set; }
    public int StockQuantity { get; set; }
    public int MinOrderQuantity { get; set; } = 1;
    public int MaxOrderQuantity { get; set; } = 999999;
    public decimal Weight { get; set; } = 0;
    public string WeightUnit { get; set; } = "kg";
    public string? Dimensions { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public bool AllowBackorders { get; set; } = false;
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public List<string> Tags { get; set; } = new List<string>();
    public Dictionary<string, string> Attributes { get; set; } = new Dictionary<string, string>();
    public List<string> ImagesToDelete { get; set; } = new List<string>();
    public List<CreateProductImageRequest> NewImages { get; set; } = new List<CreateProductImageRequest>();
    // Variants supplied by frontend to replace existing variants
    public List<CreateProductVariantRequest> Variants { get; set; } = new List<CreateProductVariantRequest>();
}

public record CreateProductVariantRequest
{
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? Sku { get; set; }
}

public class CreateProductImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public bool IsPrimary { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200).WithMessage("Product name must not exceed 200 characters.");

        RuleFor(v => v.Description)
            .NotEmpty().WithMessage("Product description is required.")
            .MaximumLength(5000).WithMessage("Product description must not exceed 5000 characters.");

        RuleFor(v => v.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero.");

        RuleFor(v => v.Currency)
            .NotEmpty().WithMessage("Currency is required.")
            .MaximumLength(3).WithMessage("Currency must be a valid 3-character code.");

        RuleFor(v => v.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");

        RuleFor(v => v.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative.");

        RuleFor(v => v.MinOrderQuantity)
            .GreaterThan(0).WithMessage("Minimum order quantity must be greater than zero.");

        RuleFor(v => v.MaxOrderQuantity)
            .GreaterThan(0).WithMessage("Maximum order quantity must be greater than zero.")
            .GreaterThanOrEqualTo(v => v.MinOrderQuantity).WithMessage("Maximum order quantity must be greater than or equal to minimum order quantity.");

        RuleFor(v => v.Weight)
            .GreaterThanOrEqualTo(0).WithMessage("Weight cannot be negative.");
            
        When(v => v.DiscountPrice.HasValue, () => {
            RuleFor(v => v.DiscountPrice!.Value)
                .GreaterThan(0).WithMessage("Discount price must be greater than zero.")
                .LessThan(v => v.Price).WithMessage("Discount price must be less than regular price.");
        });
    }
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProductCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var sellerId = _currentUserService.UserId;

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.SellerId == sellerId, cancellationToken);

        if (product == null)
        {
            return ApiResponse<Unit>.FailureResponse("Product not found or you don't have permission to update it.");
        }

        // Verify the category exists and is active
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (category == null)
        {
            return ApiResponse<Unit>.FailureResponse("Category not found or is inactive.");
        }

        var price = new Money(request.Price, request.Currency);
        Money? discountPrice = request.DiscountPrice.HasValue 
            ? new Money(request.DiscountPrice.Value, request.Currency) 
            : null;

        // Update product properties
        product.UpdateBasicInfo(request.Name, request.Description, request.ShortDescription);
        product.UpdatePricing(price, discountPrice);
        product.UpdateInventory(request.StockQuantity, request.AllowBackorders);
        product.UpdateCategory(request.CategoryId);
        product.UpdateOrderLimits(request.MinOrderQuantity, request.MaxOrderQuantity);
        product.UpdatePhysicalProperties(request.Weight, request.WeightUnit, request.Dimensions);
        product.UpdateProductDetails(request.Brand, request.Model, request.Color, request.Size, request.Material);
        product.UpdateTags(request.Tags);
        product.UpdateAttributes(request.Attributes);
        product.UpdateStatus(request.Status);

        // Handle image operations
        if (request.ImagesToDelete.Count > 0)
        {
            var imagesToRemove = await _context.ProductImages
                .Where(img => img.ProductId == product.Id && request.ImagesToDelete.Contains(img.ImageUrl))
                .ToListAsync(cancellationToken);
            
            _context.ProductImages.RemoveRange(imagesToRemove);
        }

        if (request.NewImages.Count > 0)
        {
            // Get the current max sort order
            var maxSortOrder = await _context.ProductImages
                .Where(img => img.ProductId == product.Id)
                .MaxAsync(img => (int?)img.SortOrder, cancellationToken) ?? 0;

            // Check if any existing image is marked as primary
            var hasPrimaryImage = await _context.ProductImages
                .AnyAsync(img => img.ProductId == product.Id && img.IsPrimary, cancellationToken);

            for (int i = 0; i < request.NewImages.Count; i++)
            {
                var imageRequest = request.NewImages[i];
                var sortOrder = maxSortOrder + i + 1;
                
                // If no primary image exists and this is marked as primary, or it's the first new image
                var isPrimary = imageRequest.IsPrimary || (!hasPrimaryImage && i == 0);
                
                var productImage = new ProductImage(
                    product.Id,
                    imageRequest.ImageUrl,
                    imageRequest.AltText ?? string.Empty,
                    sortOrder
                );

                if (isPrimary)
                {
                    productImage.SetAsPrimary();
                    hasPrimaryImage = true;
                }

                _context.ProductImages.Add(productImage);
            }
        }

        // Replace product variants if provided
        if (request.Variants != null)
        {
            // Remove existing variants for this product
            var existingVariants = await _context.ProductVariants
                .Where(v => v.ProductId == product.Id)
                .ToListAsync(cancellationToken);

            if (existingVariants.Any())
            {
                _context.ProductVariants.RemoveRange(existingVariants);
            }

            // Add new variants
            foreach (var v in request.Variants)
            {
                var variant = new ProductVariant
                {
                    ProductId = product.Id,
                    Size = v.Size,
                    Color = v.Color,
                    Price = v.Price ?? null,
                    StockQuantity = v.StockQuantity ?? null,
                    Sku = v.Sku
                };

                _context.ProductVariants.Add(variant);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product updated successfully.");
    }
}