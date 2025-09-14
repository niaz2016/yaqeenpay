using System.Threading.Tasks;

namespace YaqeenPay.Application.Common.Interfaces
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync(string key, int length = 6, int expirySeconds = 300);
        Task<bool> ValidateOtpAsync(string key, string otp);
        Task<bool> IsRateLimitedAsync(string key, int maxAttempts, int windowSeconds);
        Task InvalidateOtpAsync(string key);
    }
}