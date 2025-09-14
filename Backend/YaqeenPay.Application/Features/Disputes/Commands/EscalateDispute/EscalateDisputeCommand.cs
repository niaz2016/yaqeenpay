using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Disputes.Commands.EscalateDispute;

public class EscalateDisputeCommand : IRequest<EscalateDisputeResponse>
{
    public Guid DisputeId { get; set; }
}

public class EscalateDisputeResponse
{
    public Guid DisputeId { get; set; }
    public DisputeStatus Status { get; set; }
}

public class EscalateDisputeCommandHandler : IRequestHandler<EscalateDisputeCommand, EscalateDisputeResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EscalateDisputeCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EscalateDisputeResponse> Handle(EscalateDisputeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User not authenticated");
        
        var dispute = await _context.Disputes
            .Include(d => d.Order)
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Dispute with ID {request.DisputeId} not found");
        
        // Only the person who raised the dispute can escalate it
        if (dispute.RaisedById != userId)
            throw new UnauthorizedAccessException("Only the person who raised the dispute can escalate it");
        
        // Escalate the dispute
        dispute.Escalate();
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new EscalateDisputeResponse
        {
            DisputeId = dispute.Id,
            Status = dispute.Status
        };
    }
}