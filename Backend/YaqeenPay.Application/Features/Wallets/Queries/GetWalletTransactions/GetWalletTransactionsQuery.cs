using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletTransactions
{
    public class GetWalletTransactionsQuery : IRequest<PagedResult<WalletTransactionDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "date";
        public string? SortDir { get; set; } = "desc";
        public string? Type { get; set; } // TransactionType filter
    }
}