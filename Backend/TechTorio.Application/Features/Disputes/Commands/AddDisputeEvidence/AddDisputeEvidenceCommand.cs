using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using System.Security.Claims;

namespace TechTorio.Application.Features.Disputes.Commands.AddDisputeEvidence;

public class AddDisputeEvidenceCommand : IRequest<CreateDisputeResponse>
{
    public Guid DisputeId { get; set; }
    public string Evidence { get; set; } = string.Empty;
}

public class CreateDisputeResponse
{
    public Guid DisputeId { get; set; }
    public string Evidence { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; }
}

public class AddDisputeEvidenceCommandHandler : IRequestHandler<AddDisputeEvidenceCommand, CreateDisputeResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddDisputeEvidenceCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CreateDisputeResponse> Handle(AddDisputeEvidenceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var dispute = await _context.Disputes
            .Include(d => d.Order)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Dispute with ID {request.DisputeId} not found");
        
        // Only the person who raised the dispute or the counterparty can add evidence
        if (dispute.RaisedById != userId && 
            dispute.Order.BuyerId != userId && 
            dispute.Order.SellerId != userId &&
            !_currentUserService.IsInRole("Admin"))
        {
            throw new UnauthorizedAccessException("Only parties involved in the dispute can add evidence");
        }
        
        // Update evidence
        dispute.UpdateEvidence(request.Evidence);
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new CreateDisputeResponse
        {
            DisputeId = dispute.Id,
            Evidence = dispute.Evidence ?? string.Empty,
            Status = dispute.Status
        };
    }
}

public class GetBuyerOrdersQuery : IRequest<PaginatedList<BuyerOrderDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

public class BuyerOrderDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string Courier { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public DateTime? DeliveryConfirmationExpiry { get; set; }
    public bool CanReject { get; set; }
    public bool CanComplete { get; set; }
    public bool CanDispute { get; set; }
    public DateTime Created { get; set; }
}

public class PaginatedList<T> : List<T>
{
    public int PageIndex { get; private set; }
    public int TotalPages { get; private set; }

    public PaginatedList(List<T> items, int count, int pageIndex, int pageSize)
    {
        PageIndex = pageIndex;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);

        this.AddRange(items);
    }

    public bool HasPreviousPage => (PageIndex > 1);
    public bool HasNextPage => (PageIndex < TotalPages);

    public static PaginatedList<T> Create(IQueryable<T> source, int pageIndex, int pageSize)
    {
        var count = source.Count();
        var items = source.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();
        return new PaginatedList<T>(items, count, pageIndex, pageSize);
    }
}

public class GetBuyerOrdersQueryHandler : IRequestHandler<GetBuyerOrdersQuery, PaginatedList<BuyerOrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetBuyerOrdersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<BuyerOrderDto>> Handle(GetBuyerOrdersQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var query = _context.Orders
            .Include(o => o.Seller)
            .Where(o => o.BuyerId == userId)
            .AsQueryable();
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }
        
        var orders = query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new BuyerOrderDto
            {
                Id = o.Id,
                Title = o.Title,
                Description = o.Description,
                Amount = o.Amount.Amount,
                Currency = o.Amount.Currency,
                SellerName = o.Seller.UserName ?? string.Empty,
                Status = o.Status,
                Courier = o.Courier,
                TrackingNumber = o.TrackingNumber,
                ShippedDate = o.ShippedDate,
                DeliveredDate = o.DeliveredDate,
                DeliveryConfirmationExpiry = o.DeliveryConfirmationExpiry,
                CanReject = o.Status == OrderStatus.DeliveredPendingDecision,
                CanComplete = o.Status == OrderStatus.DeliveredPendingDecision,
                CanDispute = o.Status == OrderStatus.DeliveredPendingDecision || o.Status == OrderStatus.Rejected,
                Created = o.CreatedAt
            });

        return await Task.FromResult(PaginatedList<BuyerOrderDto>.Create(orders, request.PageNumber, request.PageSize));
    }
}