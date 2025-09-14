using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Commands.ConfirmTopUp
{
    public class ConfirmTopUpCommand : IRequest<TopUpDto>
    {
        public Guid TopUpId { get; set; }
        public string ExternalReference { get; set; } = string.Empty;
    }
}