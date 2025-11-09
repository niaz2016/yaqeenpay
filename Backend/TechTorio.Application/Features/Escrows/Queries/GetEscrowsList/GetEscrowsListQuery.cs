using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Application.Features.Escrows.Queries.GetEscrowById;
using TechTorio.Domain.Entities;

namespace TechTorio.Application.Features.Escrows.Queries.GetEscrowsList;

public record GetEscrowsListQuery : IRequest<ApiResponse<List<EscrowDto>>>
{
    public bool? AsSellerOnly { get; set; }
    public bool? AsBuyerOnly { get; set; }
}

public class GetEscrowsListQueryHandler : IRequestHandler<GetEscrowsListQuery, ApiResponse<List<EscrowDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEscrowsListQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<List<EscrowDto>>> Handle(GetEscrowsListQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return ApiResponse<List<EscrowDto>>.SuccessResponse(new List<EscrowDto>());
        }

        var userId = _currentUserService.UserId;

        IQueryable<Escrow> query = _context.Escrows
            .Include(e => e.Buyer)
            .Include(e => e.Seller)
            .AsQueryable();

        // Filter by role if specified
        if (request.AsBuyerOnly == true)
        {
            query = query.Where(e => e.BuyerId == userId);
        }
        else if (request.AsSellerOnly == true)
        {
            query = query.Where(e => e.SellerId == userId);
        }
        else
        {
            // Default to escrows where user is buyer or seller
            query = query.Where(e => e.BuyerId == userId || e.SellerId == userId);
        }

        // Order by creation date, newest first
        query = query.OrderByDescending(e => e.CreatedAt);

        var escrows = await query.ToListAsync(cancellationToken);

        var escrowDtos = escrows.Select(escrow => new EscrowDto
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
        }).ToList();

        return ApiResponse<List<EscrowDto>>.SuccessResponse(escrowDtos);
    }
}