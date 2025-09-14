using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateJwtToken(ApplicationUser user);
    RefreshToken GenerateRefreshToken(string ipAddress);
    (string jwtToken, RefreshToken refreshToken) GenerateTokens(ApplicationUser user, string ipAddress);
    bool ValidateJwtToken(string token, out Guid userId);
}