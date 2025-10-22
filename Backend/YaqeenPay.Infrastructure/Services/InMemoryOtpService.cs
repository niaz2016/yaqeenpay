using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Infrastructure.Services;

/// <summary>
/// In-memory OTP service for development/testing when Redis is not available
/// </summary>
public class InMemoryOtpService : IOtpService
{
    private readonly ConcurrentDictionary<string, OtpData> _otpStore = new();
    private readonly ConcurrentDictionary<string, RateLimitData> _rateLimitStore = new();

    private class OtpData
    {
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    private class RateLimitData
    {
        public int Attempts { get; set; }
        public DateTime WindowStart { get; set; }
    }

    public Task<string> GenerateOtpAsync(string key, int length = 6, int expirySeconds = 300)
    {
        var random = new Random();
        var min = (int)Math.Pow(10, length - 1);
        var max = (int)Math.Pow(10, length) - 1;
        var code = random.Next(min, max).ToString();

        var otpData = new OtpData
        {
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddSeconds(expirySeconds)
        };

        _otpStore[key] = otpData;
        return Task.FromResult(code);
    }

    public Task<bool> ValidateOtpAsync(string key, string otp)
    {
        if (_otpStore.TryGetValue(key, out var otpData))
        {
            if (DateTime.UtcNow < otpData.ExpiresAt && otpData.Code == otp)
            {
                _otpStore.TryRemove(key, out _);
                return Task.FromResult(true);
            }
            
            // Remove expired OTP
            if (DateTime.UtcNow >= otpData.ExpiresAt)
            {
                _otpStore.TryRemove(key, out _);
            }
        }

        return Task.FromResult(false);
    }

    public Task<bool> IsRateLimitedAsync(string key, int maxAttempts, int windowSeconds)
    {
        var now = DateTime.UtcNow;
        var rateLimitKey = $"rate_limit:{key}";

        if (_rateLimitStore.TryGetValue(rateLimitKey, out var rateLimitData))
        {
            // Check if window has expired
            if ((now - rateLimitData.WindowStart).TotalSeconds > windowSeconds)
            {
                // Reset window
                rateLimitData.Attempts = 1;
                rateLimitData.WindowStart = now;
                return Task.FromResult(false);
            }

            // Increment attempts
            rateLimitData.Attempts++;

            // Check if rate limited
            if (rateLimitData.Attempts > maxAttempts)
            {
                return Task.FromResult(true);
            }
        }
        else
        {
            // First attempt
            _rateLimitStore[rateLimitKey] = new RateLimitData
            {
                Attempts = 1,
                WindowStart = now
            };
        }

        return Task.FromResult(false);
    }

    public Task InvalidateOtpAsync(string key)
    {
        _otpStore.TryRemove(key, out _);
        return Task.CompletedTask;
    }
}
