using System.Threading;
using System.Threading.Tasks;
using MediatR;
using YaqeenPay.Application.Features.Payments.Commands;
using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Application.Features.Payments.Handlers
{
    public class RefundPaymentCommandHandler : IRequestHandler<RefundPaymentCommand, bool>
    {
        private readonly IPaymentGatewayService _paymentGatewayService;

        public RefundPaymentCommandHandler(IPaymentGatewayService paymentGatewayService)
        {
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<bool> Handle(RefundPaymentCommand request, CancellationToken cancellationToken)
        {
            return await _paymentGatewayService.RefundPaymentAsync(request.TransactionId, request.Amount);
        }
    }
}
