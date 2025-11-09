using MediatR;
using System.Collections.Generic;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Admin.Queries.GetTopUps
{
    public class GetTopUpsQuery : IRequest<List<TopUpDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
