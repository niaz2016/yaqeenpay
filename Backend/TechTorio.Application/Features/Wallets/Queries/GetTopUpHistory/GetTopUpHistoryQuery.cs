using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Queries.GetTopUpHistory
{
    public class GetTopUpHistoryQuery : IRequest<PaginatedList<TopUpDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }
}