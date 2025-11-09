using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletSummary
{
    public class GetWalletSummaryQuery : IRequest<WalletSummaryDto>
    {
        // No properties needed - will use current user's wallet
    }
}