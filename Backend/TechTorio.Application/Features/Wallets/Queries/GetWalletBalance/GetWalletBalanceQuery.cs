using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletBalance
{
    public class GetWalletBalanceQuery : IRequest<WalletBalanceDto>
    {
        public Guid? WalletId { get; set; }
    }
}