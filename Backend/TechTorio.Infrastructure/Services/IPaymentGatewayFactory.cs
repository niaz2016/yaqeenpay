using TechTorio.Application.Interfaces;

namespace TechTorio.Infrastructure.Services
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