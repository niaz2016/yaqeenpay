using MediatR;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class TopUpWalletCommand : IRequest<TopUpDto>
    {
        public Guid? WalletId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public TopUpChannel Channel { get; set; } = TopUpChannel.JazzCash;
    }
}