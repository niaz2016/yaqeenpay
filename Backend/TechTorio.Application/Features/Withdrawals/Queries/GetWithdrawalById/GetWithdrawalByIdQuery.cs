using MediatR;
using TechTorio.Application.Common.Models;
using System;

namespace TechTorio.Application.Features.Withdrawals.Queries.GetWithdrawalById
{
    public class GetWithdrawalByIdQuery : IRequest<WithdrawalDto?>
    {
        public Guid WithdrawalId { get; set; }
        public GetWithdrawalByIdQuery(Guid withdrawalId)
        {
            WithdrawalId = withdrawalId;
        }
    }
}