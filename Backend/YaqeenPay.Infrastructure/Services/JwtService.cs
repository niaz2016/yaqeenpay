using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Entities;
namespace YaqeenPay.Infrastructure.Services;
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    public string GenerateJwtToken(ApplicationUser user)
    {
        var secret = _configuration["JwtSettings:Secret"];
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];
        var expiryInMinutes = Convert.ToDouble(
            _configuration["JwtSettings:ExpiryInMinutes"] ?? "60");
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            // Use NumericDate for 'iat' per RFC 7519 (seconds since epoch)
            new Claim(
                JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64
            ),
            // Also include standard ASP.NET claim types for compatibility
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty)
        };
        
        // Make sure we have a key that's at least 32 bytes (256 bits) for HS256
        string keyString = secret ?? "ThisIsAVeryLongSecretKeyThatIsAtLeast32BytesLongForHS256Algorithm";
        byte[] keyBytes = Encoding.UTF8.GetBytes(keyString);
        
        // Ensure key is at least 32 bytes (256 bits)
        if (keyBytes.Length < 32)
        {
            // Extend the key to 32 bytes by padding or using a derived key
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }
        
        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryInMinutes),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    public Domain.Entities.Identity.RefreshToken GenerateRefreshToken(string ipAddress)
    {
        // Generate a unique token
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var token = Convert.ToBase64String(randomBytes);
        var refreshToken = new Domain.Entities.Identity.RefreshToken
        {
            Token = token,
            TokenHash = CreateTokenHash(token),
            ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days refresh token lifetime
            Created = DateTime.UtcNow
        };
        return refreshToken;
    }
    private string CreateTokenHash(string token)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
    public (string jwtToken, Domain.Entities.Identity.RefreshToken refreshToken) GenerateTokens(ApplicationUser user, string ipAddress)
    {
        var jwtToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken(ipAddress);
        refreshToken.UserId = user.Id;
        return (jwtToken, refreshToken);
    }
    public bool ValidateJwtToken(string token, out Guid userId)
    {
        userId = Guid.Empty;
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            string keyString = _configuration["JwtSettings:Secret"] ?? "ThisIsAVeryLongSecretKeyThatIsAtLeast32BytesLongForHS256Algorithm";
            byte[] keyBytes = Encoding.UTF8.GetBytes(keyString);
            
            // Ensure key is at least 32 bytes (256 bits)
            if (keyBytes.Length < 32)
            {
                // Extend the key to 32 bytes by padding or using a derived key
                using var sha256 = SHA256.Create();
                keyBytes = sha256.ComputeHash(keyBytes);
            }
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidIssuer = _configuration["JwtSettings:Issuer"],
                ValidAudience = _configuration["JwtSettings:Audience"],
                ClockSkew = TimeSpan.Zero
            };
            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? 
                           principal.FindFirst(JwtRegisteredClaimNames.Sub);
            if (subClaim != null && Guid.TryParse(subClaim.Value, out userId))
            {
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }
}
