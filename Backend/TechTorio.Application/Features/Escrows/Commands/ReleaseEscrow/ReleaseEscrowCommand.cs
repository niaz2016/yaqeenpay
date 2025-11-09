using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Exceptions;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Escrows.Commands.ReleaseEscrow;

public record ReleaseEscrowCommand : IRequest<ApiResponse<bool>>
{
    public Guid EscrowId { get; set; }
}

public class ReleaseEscrowCommandHandler : IRequestHandler<ReleaseEscrowCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ReleaseEscrowCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<bool>> Handle(ReleaseEscrowCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            throw new ForbiddenAccessException();
        }

        var escrow = await _context.Escrows
            .FirstOrDefaultAsync(e => e.Id == request.EscrowId, cancellationToken);

        if (escrow == null)
        {
            throw new NotFoundException(nameof(Escrow), request.EscrowId);
        }

        // Only buyer can release funds
        if (escrow.BuyerId != _currentUserService.UserId)
        {
            throw new ForbiddenAccessException();
        }

        // Can only release if in funded state
        if (escrow.Status != EscrowStatus.Funded)
        {
            return ApiResponse<bool>.FailureResponse($"Cannot release escrow with status {escrow.Status}");
        }

        // Release the funds
        escrow.Release();

        // In a real implementation, we would also add ledger entries here
        // to track the money movement from escrow to seller's account

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Funds released successfully");
    }
}