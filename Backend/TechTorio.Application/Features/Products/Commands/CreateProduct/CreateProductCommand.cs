using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand : IRequest<ApiResponse<Guid>>
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "PKR";
    public decimal? DiscountPrice { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int StockQuantity { get; set; } = 0;
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
    public bool IsFeatured { get; set; } = false;
    public DateTime? FeaturedUntil { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public List<string> Tags { get; set; } = new List<string>();
    public Dictionary<string, string> Attributes { get; set; } = new Dictionary<string, string>();
    public List<ProductFaqDto> Faqs { get; set; } = new List<ProductFaqDto>();
    public List<CreateProductImageRequest> Images { get; set; } = new List<CreateProductImageRequest>();
    // Optional product variants supplied by the frontend
    public List<CreateProductVariantRequest> Variants { get; set; } = new List<CreateProductVariantRequest>();
}

public record ProductFaqDto
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public record CreateProductImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsPrimary { get; set; } = false;
}

public record CreateProductVariantRequest
{
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? Sku { get; set; }
}

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
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

        RuleFor(v => v.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(100).WithMessage("SKU must not exceed 100 characters.");

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

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateProductCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // Verify the category exists and is active
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive, cancellationToken);

        if (category == null)
        {
            return ApiResponse<Guid>.FailureResponse("Category not found or is inactive.");
        }

        // Check if SKU already exists
        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Sku == request.Sku, cancellationToken);

        if (existingProduct != null)
        {
            return ApiResponse<Guid>.FailureResponse("A product with this SKU already exists.");
        }

        var sellerId = _currentUserService.UserId;
        var price = new Money(request.Price, request.Currency);
        Money? discountPrice = request.DiscountPrice.HasValue 
            ? new Money(request.DiscountPrice.Value, request.Currency) 
            : null;

        var product = new Product(
            sellerId,
            request.CategoryId,
            request.Name,
            request.Description,
            price,
            request.Sku,
            request.StockQuantity);

        // Update additional properties
        product.UpdateBasicInfo(request.Name, request.Description, request.ShortDescription);
        product.UpdatePricing(price, discountPrice);
        product.UpdateInventory(request.StockQuantity, request.AllowBackorders);
        product.UpdateOrderLimits(request.MinOrderQuantity, request.MaxOrderQuantity);
        product.UpdatePhysicalProperties(request.Weight, request.WeightUnit, request.Dimensions);
        product.UpdateProductDetails(request.Brand, request.Model, request.Color, request.Size, request.Material);
        product.UpdateTags(request.Tags);
        product.UpdateAttributes(request.Attributes);
        
        // Update FAQs
        var faqs = request.Faqs?.Select(f => new ProductFaq { Question = f.Question, Answer = f.Answer }).ToList() ?? new List<ProductFaq>();
        product.UpdateFaqs(faqs);
        
        // Set featured status if requested
        if (request.IsFeatured)
        {
            product.SetFeatured(request.FeaturedUntil);
        }
        
    // Honor requested status (Active/Draft/Inactive)
    product.UpdateStatus(request.Status);

        _context.Products.Add(product);

        // Add product images
        var hasImageMarkedAsPrimary = request.Images.Any(img => img.IsPrimary);
        for (int i = 0; i < request.Images.Count; i++)
        {
            var imageRequest = request.Images[i];
            var productImage = new ProductImage(
                product.Id,
                imageRequest.ImageUrl,
                imageRequest.AltText,
                imageRequest.SortOrder > 0 ? imageRequest.SortOrder : i);

            if (imageRequest.IsPrimary || (!hasImageMarkedAsPrimary && i == 0))
            {
                productImage.SetAsPrimary();
            }

            _context.ProductImages.Add(productImage);
        }

        // Add variants if provided
        if (request.Variants != null && request.Variants.Count > 0)
        {
            foreach (var v in request.Variants)
            {
                var variant = new ProductVariant
                {
                    // ProductId will be fixed up by EF Core when product is saved via relationship
                    Size = v.Size,
                    Color = v.Color,
                    Price = v.Price ?? null,
                    StockQuantity = v.StockQuantity ?? null,
                    Sku = v.Sku
                };

                product.Variants.Add(variant);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Guid>.SuccessResponse(product.Id, "Product created successfully.");
    }
}