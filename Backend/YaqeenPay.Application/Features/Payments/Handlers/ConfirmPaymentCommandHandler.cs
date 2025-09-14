using System.Threading;
using System.Threading.Tasks;
using MediatR;
using YaqeenPay.Application.Features.Payments.Commands;
using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Application.Features.Payments.Handlers
{
    public class ConfirmPaymentCommandHandler : IRequestHandler<ConfirmPaymentCommand, bool>
    {
        private readonly IPaymentGatewayService _paymentGatewayService;

        public ConfirmPaymentCommandHandler(IPaymentGatewayService paymentGatewayService)
        {
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<bool> Handle(ConfirmPaymentCommand request, CancellationToken cancellationToken)
        {
            return await _paymentGatewayService.ConfirmPaymentAsync(request.TransactionId, request.Signature);
        }
    }
}
