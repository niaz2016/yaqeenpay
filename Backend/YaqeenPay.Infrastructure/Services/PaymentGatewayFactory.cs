using Microsoft.Extensions.DependencyInjection;
using System;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.Infrastructure.Services.Easypaisa;
using YaqeenPay.Infrastructure.Services.JazzCash;

namespace YaqeenPay.Infrastructure.Services
{
    public class PaymentGatewayFactory : IPaymentGatewayFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public PaymentGatewayFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public IPaymentGatewayService GetPaymentGateway(PaymentGateway gateway)
        {
            return gateway switch
            {
                PaymentGateway.Easypaisa => _serviceProvider.GetRequiredService<EasypaisaPaymentService>(),
                PaymentGateway.JazzCash => _serviceProvider.GetRequiredService<JazzCashPaymentService>(),
                _ => throw new ArgumentException($"Unknown payment gateway: {gateway}", nameof(gateway))
            };
        }
    }
}