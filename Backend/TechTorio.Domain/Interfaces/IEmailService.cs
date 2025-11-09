using System.Threading.Tasks;

namespace TechTorio.Domain.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendWelcomeEmailAsync(string to, string firstName);
        Task SendEscrowCreatedEmailAsync(string to, string escrowId, string amount);
        Task SendEscrowFundedEmailAsync(string to, string escrowId, string amount);
        Task SendEscrowReleasedEmailAsync(string to, string escrowId, string amount);
        Task SendEscrowRefundedEmailAsync(string to, string escrowId, string amount);
        Task SendWithdrawalInitiatedEmailAsync(string to, string withdrawalId, string amount);
        Task SendWithdrawalCompletedEmailAsync(string to, string withdrawalId, string amount);
    }
}