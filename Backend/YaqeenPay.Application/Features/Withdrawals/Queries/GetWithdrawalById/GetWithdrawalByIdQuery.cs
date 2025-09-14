using MediatR;
using YaqeenPay.Application.Common.Models;
using System;

namespace YaqeenPay.Application.Features.Withdrawals.Queries.GetWithdrawalById
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