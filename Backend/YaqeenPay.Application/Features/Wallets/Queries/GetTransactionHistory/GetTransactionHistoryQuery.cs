using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetTransactionHistory
{
    public class GetTransactionHistoryQuery : IRequest<PaginatedList<TransactionDto>>
    {
        public Guid? WalletId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}