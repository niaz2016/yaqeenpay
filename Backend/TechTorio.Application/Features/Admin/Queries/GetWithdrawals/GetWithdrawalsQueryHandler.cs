using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Admin.Queries.GetWithdrawals
{
    public class GetWithdrawalsQueryHandler : IRequestHandler<GetWithdrawalsQuery, PaginatedList<WithdrawalDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetWithdrawalsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

    public Task<PaginatedList<WithdrawalDto>> Handle(GetWithdrawalsQuery request, CancellationToken cancellationToken)
    {
            var query = _context.Withdrawals.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                // Try to parse status into the enum; fallback to string comparison if parse fails
                if (Enum.TryParse<TechTorio.Domain.Entities.WithdrawalStatus>(request.Status, true, out var parsedStatus))
                {
                    query = query.Where(w => w.Status == parsedStatus);
                }
                else
                {
                    var s = request.Status.Trim().ToLower();
                    query = query.Where(w => w.Status.ToString().ToLower() == s);
                }
            }

            // Only filter by SellerId if provided; otherwise, return all withdrawals for admin
            if (!string.IsNullOrWhiteSpace(request.SellerId) && Guid.TryParse(request.SellerId, out var sellerGuid))
            {
                query = query.Where(w => w.SellerId == sellerGuid);
            }

            var projected = query
                .OrderByDescending(w => w.RequestedAt)
                .Select(w => new WithdrawalDto
                {
                    Id = w.Id,
                    SellerId = w.SellerId,
                    // Lookup seller name from Users table
                    SellerName = _context.Users
                                     .Where(u => u.Id == w.SellerId)
                                     .Select(u => (u.FirstName ?? "") + " " + (u.LastName ?? ""))
                                     .FirstOrDefault(),
                    Amount = w.Amount.Amount,
                    Currency = w.Amount.Currency,
                    Channel = w.Channel,
                    ChannelReference = w.ChannelReference,
                    Reference = w.Reference,
                    Status = w.Status,
                    Notes = w.Notes,
                    RequestedAt = w.RequestedAt,
                    SettledAt = w.SettledAt,
                    FailedAt = w.FailedAt,
                    FailureReason = w.FailureReason,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.LastModifiedAt ?? w.CreatedAt
                })
                .AsNoTracking();

            // Use synchronous Create helper which executes the query
            var result = PaginatedList<WithdrawalDto>.Create(projected, request.PageNumber, request.PageSize);
            return Task.FromResult(result);
        }
    }
}
