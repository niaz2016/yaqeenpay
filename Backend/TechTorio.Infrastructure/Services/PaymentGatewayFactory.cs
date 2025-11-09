using Microsoft.Extensions.DependencyInjection;
using System;
using TechTorio.Application.Interfaces;
using TechTorio.Infrastructure.Services.Easypaisa;
using TechTorio.Infrastructure.Services.JazzCash;

namespace TechTorio.Infrastructure.Services
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