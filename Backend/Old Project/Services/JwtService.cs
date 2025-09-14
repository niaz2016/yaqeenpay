using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using yaqeenpay.Models;
using yaqeenpay.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace yaqeenpay.Services
{
    public class JwtService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _dbContext;
        private readonly TokenValidationParameters _tokenValidationParameters;

        public JwtService(
            IOptions<JwtSettings> jwtSettings, 
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext,
            TokenValidationParameters tokenValidationParameters)
        {
            _jwtSettings = jwtSettings.Value;
            _userManager = userManager;
            _dbContext = dbContext;
            _tokenValidationParameters = tokenValidationParameters;
        }

        public async Task<JwtAuthResult> GenerateTokensAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("uid", user.Id.ToString())
            };

            // Add claims for phone and email verification status
            if (user.PhoneVerifiedAt.HasValue)
            {
                claims.Add(new Claim("phone_verified", "true"));
            }

            if (user.EmailVerifiedAt.HasValue)
            {
                claims.Add(new Claim("email_verified", "true"));
            }

            // Add KYC status
            claims.Add(new Claim("kyc", user.KycStatus.ToString()));
            
            // Add risk level
            claims.Add(new Claim("risk_level", user.RiskScore.ToString()));

            // Add roles as claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtToken = await GenerateAccessTokenAsync(claims);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id);

            return new JwtAuthResult
            {
                AccessToken = jwtToken,
                RefreshToken = refreshToken
            };
        }

        private async Task<string> GenerateAccessTokenAsync(List<Claim> claims)
        {
            var key = new RsaSecurityKey(GetRsaKey());
            var credentials = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private RSA GetRsaKey()
        {
            // In production, load from secure storage like Azure Key Vault
            // Here we'll create a new one for demo purposes
            // For production, use X509Certificate2 from a file or store
            var rsa = RSA.Create();
            
            // If you have a certificate, load it like this:
            // var cert = new X509Certificate2("path/to/cert.pfx", "password");
            // return cert.GetRSAPrivateKey();
            
            return rsa;
        }

        private async Task<RefreshTokenDto> GenerateRefreshTokenAsync(Guid userId)
        {
            // Generate a random token
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            var refreshToken = Convert.ToBase64String(randomBytes);
            
            // Hash the token for storage
            string hashedToken = HashToken(refreshToken);
            
            // Create a new refresh token
            var token = new RefreshToken
            {
                UserId = userId,
                TokenHash = hashedToken,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
            };

            // Save to database
            _dbContext.RefreshTokens.Add(token);
            await _dbContext.SaveChangesAsync();

            return new RefreshTokenDto
            {
                Token = refreshToken,
                ExpiresAt = token.ExpiresAt
            };
        }

        public async Task<JwtAuthResult?> RefreshTokenAsync(string accessToken, string refreshToken)
        {
            var principal = GetPrincipalFromExpiredToken(accessToken);
            if (principal == null)
            {
                return null;
            }

            var userId = Guid.Parse(principal.FindFirstValue("uid") ?? string.Empty);
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return null;
            }

            // Validate refresh token
            var hashedToken = HashToken(refreshToken);
            var storedToken = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.TokenHash == hashedToken && rt.IsActive)
                .FirstOrDefaultAsync();

            if (storedToken == null)
            {
                return null;
            }

            // Revoke the current refresh token
            storedToken.RevokedAt = DateTime.UtcNow;
            
            // Generate new tokens
            var result = await GenerateTokensAsync(user);
            
            // Link the new token to the old one
            var newStoredToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == userId && rt.TokenHash == HashToken(result.RefreshToken.Token));
            
            if (newStoredToken != null)
            {
                storedToken.ReplacedById = newStoredToken.Id;
            }
            
            await _dbContext.SaveChangesAsync();
            
            return result;
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = _tokenValidationParameters.ValidateIssuer,
                ValidIssuer = _tokenValidationParameters.ValidIssuer,
                ValidateAudience = _tokenValidationParameters.ValidateAudience,
                ValidAudience = _tokenValidationParameters.ValidAudience,
                ValidateIssuerSigningKey = _tokenValidationParameters.ValidateIssuerSigningKey,
                IssuerSigningKey = _tokenValidationParameters.IssuerSigningKey,
                ValidateLifetime = false // Don't validate lifetime for refreshing
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.RsaSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }

        public async Task RevokeRefreshTokensForUserAsync(Guid userId)
        {
            var tokens = await _dbContext.RefreshTokens
                .Where(t => t.UserId == userId && t.IsActive)
                .ToListAsync();
            
            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }
            
            await _dbContext.SaveChangesAsync();
        }

        // Consistently hash tokens for storage
        private string HashToken(string token)
        {
            // Use PBKDF2 to derive a hash of the token
            byte[] salt = Encoding.UTF8.GetBytes(_jwtSettings.TokenHashingSalt);
            string hashedToken = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: token,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 32));
            
            return hashedToken;
        }
    }

    public class JwtAuthResult
    {
        public string AccessToken { get; set; } = string.Empty;
        public RefreshTokenDto RefreshToken { get; set; } = new RefreshTokenDto();
    }

    public class RefreshTokenDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class JwtSettings
    {
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int AccessTokenExpirationMinutes { get; set; } = 15;
        public int RefreshTokenExpirationDays { get; set; } = 7;
        public string TokenHashingSalt { get; set; } = "DefaultSaltChangeInProduction";
    }
}