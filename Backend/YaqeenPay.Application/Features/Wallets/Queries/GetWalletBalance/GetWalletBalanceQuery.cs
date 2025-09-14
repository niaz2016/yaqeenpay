using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletBalance
{
    public class GetWalletBalanceQuery : IRequest<WalletBalanceDto>
    {
        public Guid? WalletId { get; set; }
    }
}