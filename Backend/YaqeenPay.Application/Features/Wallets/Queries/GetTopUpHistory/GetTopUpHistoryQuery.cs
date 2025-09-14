using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetTopUpHistory
{
    public class GetTopUpHistoryQuery : IRequest<PaginatedList<TopUpDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}