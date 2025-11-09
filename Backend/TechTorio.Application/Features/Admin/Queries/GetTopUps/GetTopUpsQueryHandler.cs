using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Admin.Queries.GetTopUps
{
    public class GetTopUpsQueryHandler : IRequestHandler<GetTopUpsQuery, List<TopUpDto>>
    {
        private readonly IWalletService _walletService;
        public GetTopUpsQueryHandler(IWalletService walletService)
        {
            _walletService = walletService;
        }

        public async Task<List<TopUpDto>> Handle(GetTopUpsQuery request, CancellationToken cancellationToken)
        {
            // TODO: Map TopUp entities to TopUpDto as needed
            var allTopUps = await _walletService.GetAllTopUpsAsync(request.Page, request.PageSize);
            return allTopUps;
        }
    }
}
