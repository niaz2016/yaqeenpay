using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Disputes.Commands.ResolveDispute;

public class ResolveDisputeCommand : IRequest<ResolveDisputeResponse>
{
    public Guid DisputeId { get; set; }
    public bool InFavorOfBuyer { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class ResolveDisputeResponse
{
    public Guid DisputeId { get; set; }
    public Guid OrderId { get; set; }
    public DisputeStatus Status { get; set; }
    public DisputeResolution Resolution { get; set; }
    public DateTime ResolvedAt { get; set; }
    public OrderStatus OrderStatus { get; set; }
    public EscrowStatus EscrowStatus { get; set; }
}

public class ResolveDisputeCommandHandler : IRequestHandler<ResolveDisputeCommand, ResolveDisputeResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ResolveDisputeCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ResolveDisputeResponse> Handle(ResolveDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        // Only admins can resolve disputes
        if (!_currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only administrators can resolve disputes");
        
        var dispute = await _context.Disputes
            .Include(d => d.Order)
            .ThenInclude(o => o.Escrow)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Dispute with ID {request.DisputeId} not found");
        
        // Resolve the dispute based on the decision
        if (request.InFavorOfBuyer)
        {
            dispute.ResolveInFavorOfBuyer(userId, request.Notes);
            
            // Refund the escrow if possible
            if (dispute.Order.Escrow.CanRefund())
            {
                dispute.Order.Escrow.Refund();
            }
            
            // Update the order status
            dispute.Order.ResolveDispute(true);
        }
        else
        {
            dispute.ResolveInFavorOfSeller(userId, request.Notes);
            
            // Release the escrow if possible
            if (dispute.Order.Escrow.CanRelease())
            {
                dispute.Order.Escrow.Release();
            }
            
            // Update the order status
            dispute.Order.ResolveDispute(false);
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new ResolveDisputeResponse
        {
            DisputeId = dispute.Id,
            OrderId = dispute.OrderId,
            Status = dispute.Status,
            Resolution = dispute.Resolution ?? DisputeResolution.Compromise,
            ResolvedAt = dispute.ResolvedAt ?? DateTime.UtcNow,
            OrderStatus = dispute.Order.Status,
            EscrowStatus = dispute.Order.Escrow.Status
        };
    }
}