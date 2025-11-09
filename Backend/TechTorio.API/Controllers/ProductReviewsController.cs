using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using System.Security.Claims;
using TechTorio.Domain.Entities;

namespace TechTorio.API.Controllers;

[Authorize]
public class ProductReviewsController : ApiControllerBase
{
    private readonly IApplicationDbContext _db;

    public ProductReviewsController(IApplicationDbContext db)
    {
        _db = db;
    }

    [AllowAnonymous]
    [HttpGet("products/{productId:guid}/reviews")]
    public async Task<IActionResult> GetByProduct(Guid productId)
    {
        var reviews = await _db.ProductReviews
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id,
                r.ProductId,
                r.ReviewerId,
                r.ReviewerName,
                r.Rating,
                r.Comment,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost("products/{productId:guid}/reviews")]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateProductReviewRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Validate request
        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        // Check eligibility: user must have a delivered/completed order containing the product
        var hasDeliveredOrder = await _db.Orders
            .Where(o => (o.BuyerId == userId || o.SellerId == userId) &&
                        (o.Status == TechTorio.Domain.Enums.OrderStatus.Delivered || o.Status == TechTorio.Domain.Enums.OrderStatus.Completed))
            .Join(_db.OrderItems, o => o.Id, oi => oi.OrderId, (o, oi) => new { o, oi })
            .AnyAsync(x => x.oi.ProductId == productId && x.o.BuyerId == userId);

        if (!hasDeliveredOrder)
            return Forbid();

        var review = new ProductReview(productId, userId, request.ReviewerName ?? string.Empty, request.Rating, request.Comment);
        _db.ProductReviews.Add(review);
        await _db.SaveChangesAsync(CancellationToken.None);

        // Optionally update product stats (average rating & count)
        var product = await _db.Products.FindAsync(productId);
        if (product != null)
        {
            var stats = await _db.ProductReviews.Where(r => r.ProductId == productId).ToListAsync();
            var avg = stats.Any() ? stats.Average(r => r.Rating) : 0;
            product.UpdateRating((decimal)avg, stats.Count);
            await _db.SaveChangesAsync(CancellationToken.None);
        }

        return Ok(new { review.Id });
    }

    public class CreateProductReviewRequest
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? ReviewerName { get; set; }
    }
}
