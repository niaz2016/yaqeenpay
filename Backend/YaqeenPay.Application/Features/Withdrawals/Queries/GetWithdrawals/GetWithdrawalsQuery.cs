using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Withdrawals.Queries.GetWithdrawals
{
    public class GetWithdrawalsQuery : IRequest<List<WithdrawalDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}