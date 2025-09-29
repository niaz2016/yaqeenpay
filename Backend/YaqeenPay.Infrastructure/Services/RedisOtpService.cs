using StackExchange.Redis;
using System.Collections.Concurrent;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Infrastructure.Services
{
    public class RedisOtpService : IOtpService
    {
        private readonly IConnectionMultiplexer _mux;
        private readonly IDatabase _redis;

        // In-memory fallback stores for when Redis is unavailable (dev-friendly)
        private static readonly ConcurrentDictionary<string, (string Otp, DateTime ExpiresAt)> _memoryOtps = new();
        private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowExpiresAt)> _memoryRate = new();

        public RedisOtpService(IConnectionMultiplexer redis)
        {
            _mux = redis;
            _redis = redis.GetDatabase();
        }

        public async Task<string> GenerateOtpAsync(string key, int length = 6, int expirySeconds = 300)
        {
            var otp = GenerateRandomOtp(length);
            var redisKey = $"otp:{key}";

            if (IsRedisHealthy())
            {
                try
                {
                    // Use a short timeout to avoid hanging the request when Redis is down
                    await WithTimeout(_redis.StringSetAsync(redisKey, otp, TimeSpan.FromSeconds(expirySeconds)), TimeSpan.FromMilliseconds(1500));
                    return otp;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis StringSetAsync failed, falling back to memory store: {ex.Message}");
                }
            }

            // Memory fallback
            _memoryOtps[redisKey] = (otp, DateTime.UtcNow.AddSeconds(expirySeconds));
            return otp;
        }

        public async Task<bool> ValidateOtpAsync(string key, string otp)
        {
            var redisKey = $"otp:{key}";

            if (IsRedisHealthy())
            {
                try
                {
                    var stored = await WithTimeout(_redis.StringGetAsync(redisKey), TimeSpan.FromMilliseconds(1500));
                    if (stored.HasValue && stored == otp)
                    {
                        // Best-effort delete; don't block on failure
                        try { _ = _redis.KeyDeleteAsync(redisKey, CommandFlags.FireAndForget); } catch { }
                        return true;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis StringGetAsync failed, checking memory fallback: {ex.Message}");
                }
            }

            // Memory fallback validate
            if (_memoryOtps.TryGetValue(redisKey, out var entry))
            {
                if (DateTime.UtcNow <= entry.ExpiresAt && entry.Otp == otp)
                {
                    _memoryOtps.TryRemove(redisKey, out _);
                    return true;
                }
                // cleanup expired
                if (DateTime.UtcNow > entry.ExpiresAt)
                {
                    _memoryOtps.TryRemove(redisKey, out _);
                }
            }
            return false;
        }

        public async Task<bool> IsRateLimitedAsync(string key, int maxAttempts, int windowSeconds)
        {
            var rateKey = $"otp:rate:{key}";

            if (IsRedisHealthy())
            {
                // Ensure the Redis call never hangs the request
                try
                {
                    var attempts = await WithTimeout(_redis.StringIncrementAsync(rateKey), TimeSpan.FromMilliseconds(1500));
                    if (attempts == 1)
                    {
                        try
                        {
                            // Set TTL without awaiting the network round-trip to avoid hangs
                            _ = _redis.KeyExpireAsync(rateKey, TimeSpan.FromSeconds(windowSeconds), CommandFlags.FireAndForget);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Redis KeyExpireAsync failed: {ex.Message}");
                        }
                    }
                    return attempts > maxAttempts;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis rate-limit path failed, falling back to memory: {ex.Message}");
                }
            }

            // Memory fallback for rate limiting
            var now = DateTime.UtcNow;
            var entry = _memoryRate.AddOrUpdate(rateKey,
                addValueFactory: _ => (1, now.AddSeconds(windowSeconds)),
                updateValueFactory: (_, old) =>
                {
                    if (now > old.WindowExpiresAt)
                    {
                        // Reset window
                        return (1, now.AddSeconds(windowSeconds));
                    }
                    return (old.Count + 1, old.WindowExpiresAt);
                });
            return entry.Count > maxAttempts;
        }

        public async Task InvalidateOtpAsync(string key)
        {
            var redisKey = $"otp:{key}";
            if (IsRedisHealthy())
            {
                try
                {
                    await WithTimeout(_redis.KeyDeleteAsync(redisKey), TimeSpan.FromMilliseconds(1500));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis KeyDeleteAsync failed: {ex.Message}");
                }
            }
            _memoryOtps.TryRemove(redisKey, out _);
        }

        private static string GenerateRandomOtp(int length)
        {
            var rng = new Random();
            var otp = "";
            for (int i = 0; i < length; i++)
                otp += rng.Next(0, 10).ToString();
            return otp;
        }

        private static async Task<T> WithTimeout<T>(Task<T> task, TimeSpan timeout)
        {
            var completed = await Task.WhenAny(task, Task.Delay(timeout));
            if (completed == task)
            {
                return await task; // propagate result/exceptions
            }
            throw new TimeoutException($"Operation timed out after {timeout.TotalMilliseconds}ms.");
        }

        private bool IsRedisHealthy()
        {
            try
            {
                return _mux != null && _mux.IsConnected;
            }
            catch
            {
                return false;
            }
        }
    }
}