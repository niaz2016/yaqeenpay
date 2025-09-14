using MediatR;
using System.Collections.Generic;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Admin.Queries.GetTopUps
{
    public class GetTopUpsQuery : IRequest<List<TopUpDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
