using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Services;

public class DeviceService : IDeviceService
{
    private readonly IApplicationDbContext _context;

    public DeviceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public string GenerateDeviceFingerprint(string userAgent, string? additionalInfo = null)
    {
        // Create a fingerprint based on user agent and additional browser characteristics
        var fingerprintData = $"{userAgent}|{additionalInfo ?? ""}";
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(fingerprintData));
        return Convert.ToBase64String(hashBytes);
    }

    public (string DeviceType, string Browser, string OS) ParseUserAgent(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return ("Unknown", "Unknown", "Unknown");

        var ua = userAgent.ToLower();
        
        // Detect device type
        var deviceType = "Desktop";
        if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone"))
            deviceType = "Mobile";
        else if (ua.Contains("tablet") || ua.Contains("ipad"))
            deviceType = "Tablet";

        // Detect browser
        var browser = "Unknown";
        if (ua.Contains("edg/")) browser = "Edge";
        else if (ua.Contains("chrome/")) browser = "Chrome";
        else if (ua.Contains("firefox/")) browser = "Firefox";
        else if (ua.Contains("safari/") && !ua.Contains("chrome")) browser = "Safari";
        else if (ua.Contains("opera") || ua.Contains("opr/")) browser = "Opera";

        // Detect OS
        var os = "Unknown";
        if (ua.Contains("windows")) os = "Windows";
        else if (ua.Contains("mac os")) os = "macOS";
        else if (ua.Contains("linux")) os = "Linux";
        else if (ua.Contains("android")) os = "Android";
        else if (ua.Contains("ios") || ua.Contains("iphone") || ua.Contains("ipad")) os = "iOS";

        return (deviceType, browser, os);
    }

    public async Task<UserDevice?> GetUserDeviceAsync(Guid userId, string deviceFingerprint, CancellationToken cancellationToken = default)
    {
        return await _context.UserDevices
            .FirstOrDefaultAsync(d => 
                d.UserId == userId && 
                d.DeviceFingerprint == deviceFingerprint &&
                d.IsActive, 
                cancellationToken);
    }

    public async Task<UserDevice> RegisterDeviceAsync(Guid userId, string userAgent, string ipAddress, CancellationToken cancellationToken = default)
    {
        var fingerprint = GenerateDeviceFingerprint(userAgent);
        var (deviceType, browser, os) = ParseUserAgent(userAgent);

        var device = new UserDevice
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DeviceFingerprint = fingerprint,
            UserAgent = userAgent,
            DeviceType = deviceType,
            Browser = browser,
            OperatingSystem = os,
            IpAddress = ipAddress,
            IsVerified = false,
            IsTrusted = false,
            FirstSeenAt = DateTime.UtcNow,
            LastSeenAt = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserDevices.Add(device);
        await _context.SaveChangesAsync(cancellationToken);

        return device;
    }

    public async Task VerifyDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await _context.UserDevices.FindAsync(new object[] { deviceId }, cancellationToken);
        if (device != null)
        {
            device.IsVerified = true;
            device.IsTrusted = true; // Once verified, trust the device
            device.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UpdateDeviceLastSeenAsync(Guid deviceId, CancellationToken cancellationToken = default)
    {
        var device = await _context.UserDevices.FindAsync(new object[] { deviceId }, cancellationToken);
        if (device != null)
        {
            device.LastSeenAt = DateTime.UtcNow;
            device.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
