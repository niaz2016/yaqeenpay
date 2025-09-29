using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class SubmitTopUpReferenceCommand : IRequest<TopUpDto>
    {
        public Guid TopUpId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
    }
}
