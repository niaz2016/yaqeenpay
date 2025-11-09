using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public bool IsInRole(string role)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.IsInRole(role) ?? false;
    }
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId => GetUserId() ?? Guid.Empty;
    public string? IpAddress => GetIpAddress();
    public string? UserAgent => GetUserAgent();

    private Guid? GetUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            return (Guid?)null;

        // Try common claim types in order of likelihood
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                     ?? user.FindFirstValue(ClaimTypes.Name); // fallback if Name holds the id

        if (string.IsNullOrWhiteSpace(idValue))
            return (Guid?)null;

        return Guid.TryParse(idValue, out var parsedId) ? parsedId : (Guid?)null;
    }

    private string? GetIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return null;

        // Try to get the IP from X-Forwarded-For header
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // X-Forwarded-For may contain multiple IPs, the first one is the client's
            return forwardedFor.Split(',')[0].Trim();
        }

        // Fallback to remote IP address
        return httpContext.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetUserAgent()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return null;

        return httpContext.Request.Headers["User-Agent"].FirstOrDefault();
    }
}