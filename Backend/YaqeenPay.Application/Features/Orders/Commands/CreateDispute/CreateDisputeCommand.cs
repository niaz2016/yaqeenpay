using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Orders.Commands.CreateDispute;

public class CreateDisputeCommand : IRequest<CreateDisputeResponse>
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Evidence { get; set; }
}

public class CreateDisputeResponse
{
    public Guid DisputeId { get; set; }
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDisputeCommandHandler : IRequestHandler<CreateDisputeCommand, CreateDisputeResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateDisputeCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CreateDisputeResponse> Handle(CreateDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User not authenticated");
        
        var order = await _context.Orders
            .Include(o => o.Escrow)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // Only the buyer or seller can create a dispute
    if (order.BuyerId != userId && order.SellerId != userId)
            throw new UnauthorizedAccessException("Only the buyer or seller can create a dispute");
        
        // Mark the order as disputed
        order.MarkAsDisputed();
        
        // Create a new dispute
        var dispute = new Dispute(
            orderId: order.Id,
            raisedById: userId,
            reason: request.Reason,
            description: request.Description,
            evidence: request.Evidence
        );
        
        // If escrow exists, mark it as disputed
        if (order.Escrow.CanDispute())
        {
            order.Escrow.Dispute();
        }
        
        _context.Disputes.Add(dispute);
        await _context.SaveChangesAsync(cancellationToken);
        
        return new CreateDisputeResponse
        {
            DisputeId = dispute.Id,
            OrderId = order.Id,
            Reason = dispute.Reason,
            Status = dispute.Status,
            CreatedAt = dispute.CreatedAt
        };
    }
}