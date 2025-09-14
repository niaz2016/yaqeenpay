using MediatR;

namespace YaqeenPay.Application.Features.Payments.Commands
{
    public class TopUpWalletCommand : IRequest<string>
    {
        public decimal Amount { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string CallbackUrl { get; set; } = string.Empty;
    }
}
