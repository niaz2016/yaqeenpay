using MediatR;
using System;

namespace YaqeenPay.Application.Features.Withdrawals.Commands.CancelWithdrawal
{
    public class CancelWithdrawalCommand : IRequest<bool>
    {
        public Guid WithdrawalId { get; set; }
        public CancelWithdrawalCommand(Guid withdrawalId)
        {
            WithdrawalId = withdrawalId;
        }
    }
}