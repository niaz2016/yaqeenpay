using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Escrows.Queries.GetEscrowById;

public record GetEscrowByIdQuery : IRequest<ApiResponse<EscrowDto>>
{
    public Guid EscrowId { get; set; }
}

public class EscrowDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class GetEscrowByIdQueryHandler : IRequestHandler<GetEscrowByIdQuery, ApiResponse<EscrowDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEscrowByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<EscrowDto>> Handle(GetEscrowByIdQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            throw new ForbiddenAccessException();
        }

        var escrow = await _context.Escrows
            .Include(e => e.Buyer)
            .Include(e => e.Seller)
            .FirstOrDefaultAsync(e => e.Id == request.EscrowId, cancellationToken);

        if (escrow == null)
        {
            throw new NotFoundException(nameof(Escrow), request.EscrowId);
        }

        // Ensure user is either buyer or seller
        if (escrow.BuyerId != _currentUserService.UserId && escrow.SellerId != _currentUserService.UserId)
        {
            throw new ForbiddenAccessException();
        }

        var escrowDto = new EscrowDto
        {
            Id = escrow.Id,
            Amount = escrow.Amount.Value,
            Currency = escrow.Amount.Currency,
            Status = escrow.Status.ToString(),
            Title = escrow.Title,
            Description = escrow.Description,
            BuyerId = escrow.BuyerId,
            BuyerName = escrow.Buyer?.UserName ?? "Unknown",
            SellerId = escrow.SellerId,
            SellerName = escrow.Seller?.UserName ?? "Unknown",
            CreatedAt = escrow.CreatedAt,
            CompletedAt = escrow.CompletedDate
        };

        return ApiResponse<EscrowDto>.SuccessResponse(escrowDto);
    }
}