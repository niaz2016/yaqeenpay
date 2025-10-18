using System;
using System.Linq;
using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly GoogleAuthSettings _settings;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(IOptions<GoogleAuthSettings> options, ILogger<GoogleAuthService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<GoogleUserInfo?> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            _logger.LogWarning("Google ID token validation failed: token was empty");
            return null;
        }

        if (_settings.ClientIds == null || _settings.ClientIds.Count == 0)
        {
            _logger.LogError("Google ID token validation failed: no client IDs configured");
            throw new InvalidOperationException("Google authentication is not configured.");
        }

        var validationSettings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = _settings.ClientIds
        };

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);

            if (!payload.EmailVerified)
            {
                _logger.LogWarning("Google ID token rejected: email not verified for {Email}", payload.Email);
                return null;
            }

            if (string.IsNullOrWhiteSpace(payload.Email))
            {
                _logger.LogWarning("Google ID token rejected: email missing in payload");
                return null;
            }

            if (_settings.HostedDomains != null && _settings.HostedDomains.Count > 0)
            {
                var emailDomain = payload.Email?.Split('@').LastOrDefault() ?? string.Empty;
                var allowed = _settings.HostedDomains.Any(domain =>
                    string.Equals(domain, emailDomain, StringComparison.OrdinalIgnoreCase));

                if (!allowed)
                {
                    _logger.LogWarning("Google ID token rejected: domain {Domain} not allowed", emailDomain);
                    return null;
                }
            }

            return new GoogleUserInfo(
                payload.Subject,
                payload.Email!,
                payload.GivenName,
                payload.FamilyName,
                payload.Picture,
                payload.EmailVerified
            );
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Google ID token validation failed: invalid token");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while validating Google ID token");
            return null;
        }
    }
}
