namespace YaqeenPay.Application.Common.Interfaces;

public interface IApiRateLimitService
{
    /// <summary>
    /// Checks if a request is allowed based on rate limits
    /// </summary>
    /// <param name="identifier">IP address or device fingerprint</param>
    /// <param name="endpoint">The endpoint being accessed</param>
    /// <param name="maxRequests">Maximum requests allowed in the time window</param>
    /// <param name="windowMinutes">Time window in minutes</param>
    /// <returns>True if allowed, false if rate limit exceeded</returns>
    Task<bool> IsAllowedAsync(string identifier, string endpoint, int maxRequests, int windowMinutes);
    
    /// <summary>
    /// Records a request attempt
    /// </summary>
    Task RecordRequestAsync(string identifier, string endpoint);
    
    /// <summary>
    /// Gets remaining requests in current window
    /// </summary>
    Task<int> GetRemainingRequestsAsync(string identifier, string endpoint, int maxRequests, int windowMinutes);
    
    /// <summary>
    /// Manually blocks an identifier for a specific duration
    /// </summary>
    Task BlockIdentifierAsync(string identifier, string endpoint, TimeSpan duration);
}
