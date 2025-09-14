using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletSummary
{
    public class GetWalletSummaryQuery : IRequest<WalletSummaryDto>
    {
        // No properties needed - will use current user's wallet
    }
}