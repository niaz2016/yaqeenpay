using MediatR;
using System;

namespace TechTorio.Application.Features.Admin.Commands.ApproveWithdrawal
{
    public class ApproveWithdrawalCommand : IRequest<bool>
    {
        public Guid WithdrawalId { get; set; }
        public string ChannelReference { get; set; } = string.Empty;
    }
}
