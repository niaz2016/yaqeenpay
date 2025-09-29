using YaqeenPay.Application.Interfaces;

namespace YaqeenPay.Infrastructure.Services
{
    public enum PaymentGateway
    {
        Easypaisa,
        JazzCash
    }

    public interface IPaymentGatewayFactory
    {
        IPaymentGatewayService GetPaymentGateway(PaymentGateway gateway);
    }
}