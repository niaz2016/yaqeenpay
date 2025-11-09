using MediatR;
using System;

namespace TechTorio.Application.Features.Admin.Commands.FailWithdrawal
{
    public class FailWithdrawalCommand : IRequest<bool>
 {
        public Guid WithdrawalId { get; set; }
        public string FailureReason { get; set; } = string.Empty;
    }
}