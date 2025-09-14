using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Domain.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool Success, string UserId)> CreateUserAsync(string email, string password, string firstName, string lastName);
        Task<(bool Success, string UserId)> LoginAsync(string email, string password);
        Task<string> GenerateJwtTokenAsync(string userId);
        Task<string> GenerateRefreshTokenAsync(string userId);
        Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);
        Task<ApplicationUser?> GetUserByIdAsync(string userId);
    }
}