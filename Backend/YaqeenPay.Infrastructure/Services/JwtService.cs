using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Infrastructure.Services.Security;

namespace YaqeenPay.Infrastructure.Services;
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly JwtKeyMaterial? _material;
    public JwtService(IConfiguration configuration, JwtKeyMaterial? material = null)
    {
        _configuration = configuration;
        _material = material;
    }
    public string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles)
    {
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];
        // Default to 15 minutes per architecture plan
        var expiryInMinutes = Convert.ToDouble(_configuration["JwtSettings:ExpiryInMinutes"] ?? "15");
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
        // Add role claims
        if (roles != null)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }
        
        // Load RSA key for RS256 signing
        // Prefer injected key material (may be generated in Development)
        string? privateKeyBase64 = _material?.PrivateKeyBase64 ?? _configuration["JwtSettings:PrivateKey"]; // dev via user-secrets
        if (string.IsNullOrWhiteSpace(privateKeyBase64))
        {
            throw new InvalidOperationException("Missing JwtSettings:PrivateKey for RSA signing.");
        }
        byte[] privateKeyBytes = Convert.FromBase64String(privateKeyBase64);

        // Build signing key from RSAParameters to avoid disposed RSA later during signing
        RSAParameters rsaParams;
        using (var rsaForParams = RSA.Create())
        {
            rsaForParams.ImportPkcs8PrivateKey(privateKeyBytes, out _);
            rsaParams = rsaForParams.ExportParameters(true);
        }
        var key = new RsaSecurityKey(rsaParams);
        // Add key id (kid) if provided to support rotation/JWKS later
        var kid = _material?.KeyId ?? _configuration["JwtSettings:KeyId"]; // optional
        if (!string.IsNullOrEmpty(kid)) key.KeyId = kid;
        var creds = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);
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
    public string ComputeRefreshTokenHash(string token) => CreateTokenHash(token);
    public (string jwtToken, Domain.Entities.Identity.RefreshToken refreshToken) GenerateTokens(ApplicationUser user, IEnumerable<string> roles, string ipAddress)
    {
        var jwtToken = GenerateJwtToken(user, roles);
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
            // Validate using RSA public key (SubjectPublicKeyInfo / X.509) in Base64
            string? publicKeyBase64 = _material?.PublicKeyBase64 ?? _configuration["JwtSettings:PublicKey"];
            if (string.IsNullOrWhiteSpace(publicKeyBase64))
            {
                throw new InvalidOperationException("Missing JwtSettings:PublicKey for JWT validation.");
            }
            byte[] publicKeyBytes = Convert.FromBase64String(publicKeyBase64);

            // Build validation key from RSAParameters to avoid disposed RSA later
            RSAParameters rsaParams;
            using (var rsaForParams = RSA.Create())
            {
                rsaForParams.ImportSubjectPublicKeyInfo(publicKeyBytes, out _);
                rsaParams = rsaForParams.ExportParameters(false);
            }
            var rsaKey = new RsaSecurityKey(rsaParams);
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = rsaKey,
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
