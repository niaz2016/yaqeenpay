using System.Threading.Tasks;

namespace TechTorio.Application.Interfaces
{
    public interface IPaymentGatewayService
    {
        Task<string> CreatePaymentRequestAsync(decimal amount, string customerId, string callbackUrl);
        Task<bool> ConfirmPaymentAsync(string transactionId, string signature);
        Task<bool> ReleaseFundsAsync(string transactionId, decimal amount);
        Task<bool> RefundPaymentAsync(string transactionId, decimal amount);
    }
}
