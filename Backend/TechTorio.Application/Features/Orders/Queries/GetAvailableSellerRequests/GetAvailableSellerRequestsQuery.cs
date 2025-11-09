using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Orders.Queries.GetAvailableSellerRequests;

public class GetAvailableSellerRequestsQuery : IRequest<PaginatedList<SellerRequestDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public string? Currency { get; set; }
}

public class SellerRequestDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public DateTime Created { get; set; }
}

public class GetAvailableSellerRequestsQueryHandler : IRequestHandler<GetAvailableSellerRequestsQuery, PaginatedList<SellerRequestDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAvailableSellerRequestsQueryHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<SellerRequestDto>> Handle(GetAvailableSellerRequestsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        
        // Get seller requests: orders where BuyerId = SellerId (seller created a request)
        // and status is Created (available for buyers to accept)
        var query = _context.Orders
            .Include(o => o.Seller)
            .Where(o => o.BuyerId == o.SellerId && // This is a seller request
                       o.Status == OrderStatus.Created && // Still available
                       o.SellerId != currentUserId) // Don't show current user's own requests
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            query = query.Where(o => o.Title.Contains(request.SearchTerm) || 
                                   o.Description.Contains(request.SearchTerm) ||
                                   o.Seller.UserName!.Contains(request.SearchTerm));
        }

        // Apply amount filters
        if (request.MinAmount.HasValue)
        {
            query = query.Where(o => o.Amount.Amount >= request.MinAmount.Value);
        }
        
        if (request.MaxAmount.HasValue)
        {
            query = query.Where(o => o.Amount.Amount <= request.MaxAmount.Value);
        }

        // Apply currency filter
        if (!string.IsNullOrEmpty(request.Currency))
        {
            query = query.Where(o => o.Amount.Currency == request.Currency);
        }

        var queryable = query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new SellerRequestDto
            {
                Id = o.Id,
                Title = o.Title,
                Description = o.Description,
                Amount = o.Amount.Amount,
                Currency = o.Amount.Currency,
                SellerName = o.Seller.UserName ?? string.Empty,
                SellerId = o.SellerId,
                ImageUrls = o.ImageUrls,
                Created = o.CreatedAt
            });

        var totalCount = await queryable.CountAsync(cancellationToken);
        var items = await queryable
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<SellerRequestDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}