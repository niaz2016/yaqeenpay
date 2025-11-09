namespace TechTorio.Application.Common.Interfaces;

public interface ISmsRateLimitService
{
    /// <summary>
    /// Checks if the device/IP is allowed to send SMS
    /// </summary>
    /// <param name="deviceIdentifier">Device ID or IP address</param>
    /// <param name="phoneNumber">Phone number requesting SMS</param>
    /// <returns>True if allowed, false if blocked</returns>
    Task<bool> IsAllowedAsync(string deviceIdentifier, string phoneNumber);
    
    /// <summary>
    /// Records an SMS attempt
    /// </summary>
    /// <param name="deviceIdentifier">Device ID or IP address</param>
    /// <param name="phoneNumber">Phone number requesting SMS</param>
    Task RecordAttemptAsync(string deviceIdentifier, string phoneNumber);
    
    /// <summary>
    /// Gets the remaining attempts for a device/IP
    /// </summary>
    /// <param name="deviceIdentifier">Device ID or IP address</param>
    /// <returns>Number of remaining attempts</returns>
    Task<int> GetRemainingAttemptsAsync(string deviceIdentifier);
    
    /// <summary>
    /// Gets the time until the block is lifted
    /// </summary>
    /// <param name="deviceIdentifier">Device ID or IP address</param>
    /// <returns>TimeSpan until unblocked, or null if not blocked</returns>
    Task<TimeSpan?> GetBlockDurationAsync(string deviceIdentifier);
}
