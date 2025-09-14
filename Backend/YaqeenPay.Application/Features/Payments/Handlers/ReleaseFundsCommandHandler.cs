using System.Threading;
using System.Threading.Tasks;
using MediatR;
using YaqeenPay.Application.Features.Payments.Commands;
using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Application.Features.Payments.Handlers
{
    public class ReleaseFundsCommandHandler : IRequestHandler<ReleaseFundsCommand, bool>
    {
        private readonly IPaymentGatewayService _paymentGatewayService;

        public ReleaseFundsCommandHandler(IPaymentGatewayService paymentGatewayService)
        {
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<bool> Handle(ReleaseFundsCommand request, CancellationToken cancellationToken)
        {
            return await _paymentGatewayService.ReleaseFundsAsync(request.TransactionId, request.Amount);
        }
    }
}
