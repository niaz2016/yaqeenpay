using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles);
    RefreshToken GenerateRefreshToken(string ipAddress);
    (string jwtToken, RefreshToken refreshToken) GenerateTokens(ApplicationUser user, IEnumerable<string> roles, string ipAddress);
    bool ValidateJwtToken(string token, out Guid userId);
    // Computes a stable hash for a refresh token string for secure comparison/storage
    string ComputeRefreshTokenHash(string token);
}