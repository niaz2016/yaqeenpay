using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Admin.Queries.GetOrders;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, List<AdminOrderDto>>
{
    private readonly IApplicationDbContext _context;
    public GetOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminOrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .AsNoTracking() // Read-only query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = orders.Select(o => new AdminOrderDto
        {
            Id = o.Id,
            OrderNumber = o.Title,
            BuyerEmail = o.Buyer != null ? o.Buyer!.Email : string.Empty,
            SellerEmail = o.Seller != null ? o.Seller!.Email : string.Empty,
            Name = o.Buyer != null ? ($"{(o.Buyer.FirstName ?? "").Trim()} {(o.Buyer.LastName ?? "").Trim()}").Trim() : string.Empty,
            KycStatus = o.Buyer != null ? (o.Buyer.KycStatus.ToString() ?? "Not Submitted") : "Not Submitted",
            UserStatus = o.Buyer != null ? (o.Buyer.EmailConfirmed ? "Active" : "Inactive") : "Inactive",
            Amount = o.Amount.Value,
            Status = o.Status.ToString(),
            CreatedAt = o.CreatedAt
        }).ToList();
        return result;
    }
}
