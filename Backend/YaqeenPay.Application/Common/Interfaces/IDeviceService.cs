using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IDeviceService
{
    /// <summary>
    /// Generate a device fingerprint from user agent and other browser info
    /// </summary>
    string GenerateDeviceFingerprint(string userAgent, string? additionalInfo = null);
    
    /// <summary>
    /// Parse user agent to extract device information
    /// </summary>
    (string DeviceType, string Browser, string OS) ParseUserAgent(string userAgent);
    
    /// <summary>
    /// Check if device is already registered for user
    /// </summary>
    Task<UserDevice?> GetUserDeviceAsync(Guid userId, string deviceFingerprint, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Register a new device for user
    /// </summary>
    Task<UserDevice> RegisterDeviceAsync(Guid userId, string userAgent, string ipAddress, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Mark device as verified after OTP confirmation
    /// </summary>
    Task VerifyDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update last seen timestamp for device
    /// </summary>
    Task UpdateDeviceLastSeenAsync(Guid deviceId, CancellationToken cancellationToken = default);
}
