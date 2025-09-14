using MediatR;

namespace YaqeenPay.Application.Features.Payments.Commands
{
    public class RefundPaymentCommand : IRequest<bool>
    {
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
