using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Admin.Queries.GetWithdrawals
{
    public class GetWithdrawalsQuery : IRequest<PaginatedList<WithdrawalDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        // optional filters
        public string? Status { get; set; }
        public string? SellerId { get; set; }
    }
}
