using System;
using System.Threading.Tasks;
using StackExchange.Redis;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Infrastructure.Services
{
    public class RedisOtpService : IOtpService
    {
        private readonly IDatabase _redis;
        public RedisOtpService(IConnectionMultiplexer redis)
        {
            _redis = redis.GetDatabase();
        }

        public async Task<string> GenerateOtpAsync(string key, int length = 6, int expirySeconds = 300)
        {
            var otp = GenerateRandomOtp(length);
            await _redis.StringSetAsync($"otp:{key}", otp, TimeSpan.FromSeconds(expirySeconds));
            return otp;
        }

        public async Task<bool> ValidateOtpAsync(string key, string otp)
        {
            var stored = await _redis.StringGetAsync($"otp:{key}");
            if (stored.HasValue && stored == otp)
            {
                await _redis.KeyDeleteAsync($"otp:{key}");
                return true;
            }
            return false;
        }

        public async Task<bool> IsRateLimitedAsync(string key, int maxAttempts, int windowSeconds)
        {
            var rateKey = $"otp:rate:{key}";
            var attempts = await _redis.StringIncrementAsync(rateKey);
            if (attempts == 1)
                await _redis.KeyExpireAsync(rateKey, TimeSpan.FromSeconds(windowSeconds));
            return attempts > maxAttempts;
        }

        public async Task InvalidateOtpAsync(string key)
        {
            await _redis.KeyDeleteAsync($"otp:{key}");
        }

        private static string GenerateRandomOtp(int length)
        {
            var rng = new Random();
            var otp = "";
            for (int i = 0; i < length; i++)
                otp += rng.Next(0, 10).ToString();
            return otp;
        }
    }
}