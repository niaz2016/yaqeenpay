using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles);
    RefreshToken GenerateRefreshToken(string ipAddress);
    (string jwtToken, RefreshToken refreshToken) GenerateTokens(ApplicationUser user, IEnumerable<string> roles, string ipAddress);
    bool ValidateJwtToken(string token, out Guid userId);
}