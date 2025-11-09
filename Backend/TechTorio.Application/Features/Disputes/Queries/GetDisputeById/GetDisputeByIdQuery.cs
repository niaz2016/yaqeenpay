using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Disputes.Queries.GetDisputeById;

public class GetDisputeByIdQuery : IRequest<DisputeDetailDto>
{
    public Guid DisputeId { get; set; }
}

public class DisputeDetailDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
    public string OrderCurrency { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public Guid RaisedById { get; set; }
    public string RaisedByName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Evidence { get; set; }
    public string? AdminNotes { get; set; }
    public DisputeStatus Status { get; set; }
    public DateTime Created { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DisputeResolution? Resolution { get; set; }
    public Guid? ResolvedById { get; set; }
    public string? ResolvedByName { get; set; }
}

public class GetDisputeByIdQueryHandler : IRequestHandler<GetDisputeByIdQuery, DisputeDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetDisputeByIdQueryHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeDetailDto> Handle(GetDisputeByIdQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var dispute = await _context.Disputes
            .Include(d => d.Order)
            .ThenInclude(o => o.Buyer)
            .Include(d => d.Order)
            .ThenInclude(o => o.Seller)
            .Include(d => d.RaisedBy)
            .Include(d => d.ResolvedBy)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dispute with ID {request.DisputeId} not found");
        
        // Check if user is authorized to view this dispute
        bool isAdmin = _currentUserService.IsInRole("Admin");
    bool isBuyer = dispute.Order.BuyerId == userId;
    bool isSeller = dispute.Order.SellerId == userId;
        
        if (!isAdmin && !isBuyer && !isSeller)
            throw new UnauthorizedAccessException("You are not authorized to view this dispute");
        
        return new DisputeDetailDto
        {
            Id = dispute.Id,
            OrderId = dispute.OrderId,
            OrderTitle = dispute.Order.Title,
            OrderAmount = dispute.Order.Amount.Amount,
            OrderCurrency = dispute.Order.Amount.Currency,
            BuyerId = dispute.Order.BuyerId,
            BuyerName = dispute.Order.Buyer.UserName ?? string.Empty,
            SellerId = dispute.Order.SellerId,
            SellerName = dispute.Order.Seller.UserName ?? string.Empty,
            RaisedById = dispute.RaisedById,
            RaisedByName = dispute.RaisedBy.UserName ?? string.Empty,
            Reason = dispute.Reason,
            Description = dispute.Description,
            Evidence = dispute.Evidence,
            AdminNotes = isAdmin ? dispute.AdminNotes : null, // Only show admin notes to admins
            Status = dispute.Status,
            Created = dispute.CreatedAt,
            ResolvedAt = dispute.ResolvedAt,
            Resolution = dispute.Resolution,
            ResolvedById = dispute.ResolvedById,
            ResolvedByName = dispute.ResolvedBy?.UserName
        };
    }
}