using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wishlist.Commands.AddToWishlist;

public record AddToWishlistCommand : IRequest<ApiResponse<Unit>>
{
    public Guid ProductId { get; set; }
}

public class AddToWishlistCommandValidator : AbstractValidator<AddToWishlistCommand>
{
    public AddToWishlistCommandValidator()
    {
        RuleFor(v => v.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");
    }
}

public class AddToWishlistCommandHandler : IRequestHandler<AddToWishlistCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddToWishlistCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(AddToWishlistCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        // Check if product exists and is available
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && 
                                    p.Status == ProductStatus.Active && 
                                    p.IsActive, cancellationToken);

        if (product == null)
        {
            return ApiResponse<Unit>.FailureResponse("Product not found or not available.");
        }

        // Check if already in wishlist
        var existingItem = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && 
                                    w.ProductId == request.ProductId &&
                                    w.IsActive, cancellationToken);

        if (existingItem != null)
        {
            return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product is already in your wishlist.");
        }

        // Add to wishlist
        var wishlistItem = new WishlistItem(userId, request.ProductId)
        {
            Id = Guid.NewGuid(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            LastModifiedBy = userId
        };

        _context.WishlistItems.Add(wishlistItem);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product added to wishlist.");
    }
}
