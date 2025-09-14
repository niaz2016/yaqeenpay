using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Disputes.Commands.AddAdminNotes;

public class AddAdminNotesCommand : IRequest<AddAdminNotesResponse>
{
    public Guid DisputeId { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class AddAdminNotesResponse
{
    public Guid DisputeId { get; set; }
    public string AdminNotes { get; set; } = string.Empty;
}

public class AddAdminNotesCommandHandler : IRequestHandler<AddAdminNotesCommand, AddAdminNotesResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddAdminNotesCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AddAdminNotesResponse> Handle(AddAdminNotesCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        // Only admins can add admin notes
        if (!_currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only administrators can add admin notes");
        
        var dispute = await _context.Disputes
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Dispute with ID {request.DisputeId} not found");
        
        // Add admin notes
        dispute.AddAdminNotes(request.Notes);
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new AddAdminNotesResponse
        {
            DisputeId = dispute.Id,
            AdminNotes = dispute.AdminNotes ?? string.Empty
        };
    }
}