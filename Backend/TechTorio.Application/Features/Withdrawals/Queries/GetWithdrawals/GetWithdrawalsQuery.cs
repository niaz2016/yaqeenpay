using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Withdrawals.Queries.GetWithdrawals
{
    public class GetWithdrawalsQuery : IRequest<List<WithdrawalDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}