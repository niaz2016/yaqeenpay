using MediatR;

namespace TechTorio.Application.Features.Payments.Commands
{
    public class ConfirmPaymentCommand : IRequest<bool>
    {
        public string TransactionId { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
    }
}
