using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Disputes.Queries.GetUserDisputes;

public class GetUserDisputesQuery : IRequest<PaginatedList<UserDisputeDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

public class UserDisputeDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public bool RaisedByUser { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; }
    public DateTime Created { get; set; }
    public DisputeResolution? Resolution { get; set; }
}

public class GetUserDisputesQueryHandler : IRequestHandler<GetUserDisputesQuery, PaginatedList<UserDisputeDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserDisputesQueryHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<UserDisputeDto>> Handle(GetUserDisputesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        // Get disputes where the user is either the buyer, seller, or the one who raised the dispute
        var query = _context.Disputes
            .Include(d => d.Order)
            .Include(d => d.RaisedBy)
            .Where(d => d.Order.BuyerId == userId || 
                       d.Order.SellerId == userId)
            .AsQueryable();
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<DisputeStatus>(request.Status, true, out var status))
        {
            query = query.Where(d => d.Status == status);
        }
        
        
        var disputesQuery = query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new UserDisputeDto
            {
                Id = d.Id,
                OrderId = d.OrderId,
                OrderTitle = d.Order.Title,
                RaisedByUser = d.RaisedById == userId,
                Reason = d.Reason,
                Status = d.Status,
                Created = d.CreatedAt,
                Resolution = d.Resolution
            });
        return PaginatedList<UserDisputeDto>.Create(disputesQuery, request.PageNumber, request.PageSize);
    }
}