using System.Threading;
using System.Threading.Tasks;
using MediatR;
using YaqeenPay.Application.Features.Payments.Commands;
using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Application.Features.Payments.Handlers
{
    public class TopUpWalletCommandHandler : IRequestHandler<TopUpWalletCommand, string>
    {
        private readonly IPaymentGatewayService _paymentGatewayService;

        public TopUpWalletCommandHandler(IPaymentGatewayService paymentGatewayService)
        {
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<string> Handle(TopUpWalletCommand request, CancellationToken cancellationToken)
        {
            // Call Easypaisa to create payment request
            return await _paymentGatewayService.CreatePaymentRequestAsync(request.Amount, request.CustomerId, request.CallbackUrl);
        }
    }
}
