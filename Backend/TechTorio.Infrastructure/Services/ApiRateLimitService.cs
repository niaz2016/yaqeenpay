using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Services;

public class ApiRateLimitService : IApiRateLimitService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ILogger<ApiRateLimitService> _logger;

    public ApiRateLimitService(IApplicationDbContext dbContext, ILogger<ApiRateLimitService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<bool> IsAllowedAsync(string identifier, string endpoint, int maxRequests, int windowMinutes)
    {
        try
        {
            var now = DateTime.UtcNow;

            // Clean up old records
            await CleanupOldRecordsAsync(endpoint);

            var rateLimit = await _dbContext.ApiRateLimits
                .FirstOrDefaultAsync(r => r.Identifier == identifier && r.Endpoint == endpoint);

            if (rateLimit == null)
            {
                return true; // No record, allow
            }

            // Check if blocked
            if (rateLimit.BlockedUntil.HasValue && rateLimit.BlockedUntil.Value > now)
            {
                return false; // Still blocked
            }

            // Check if window has expired
            var windowExpiry = rateLimit.WindowStart.AddMinutes(windowMinutes);
            if (now >= windowExpiry)
            {
                // Reset counter for new window
                rateLimit.RequestCount = 0;
                rateLimit.WindowStart = now;
                rateLimit.BlockedUntil = null;
                rateLimit.UpdatedAt = now;
                await _dbContext.SaveChangesAsync(default);
                return true;
            }

            // Check if exceeded max requests
            if (rateLimit.RequestCount >= maxRequests)
            {
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            // Fail-open on rate limit storage errors to avoid blocking login with 500s
            _logger.LogError(ex, "API rate limit IsAllowedAsync failed for {Endpoint} and identifier {Identifier}", endpoint, identifier);
            return true;
        }
    }

    public async Task RecordRequestAsync(string identifier, string endpoint)
    {
        try
        {
            var now = DateTime.UtcNow;

            var rateLimit = await _dbContext.ApiRateLimits
                .FirstOrDefaultAsync(r => r.Identifier == identifier && r.Endpoint == endpoint);

            if (rateLimit == null)
            {
                rateLimit = new ApiRateLimit
                {
                    Id = Guid.NewGuid(),
                    Identifier = identifier,
                    Endpoint = endpoint,
                    RequestCount = 1,
                    WindowStart = now,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _dbContext.ApiRateLimits.Add(rateLimit);
            }
            else
            {
                rateLimit.RequestCount++;
                rateLimit.UpdatedAt = now;
            }

            await _dbContext.SaveChangesAsync(default);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API rate limit RecordRequestAsync failed for {Endpoint} and identifier {Identifier}", endpoint, identifier);
            // swallow to avoid failing the request path
        }
    }

    public async Task<int> GetRemainingRequestsAsync(string identifier, string endpoint, int maxRequests, int windowMinutes)
    {
        try
        {
            var rateLimit = await _dbContext.ApiRateLimits
                .FirstOrDefaultAsync(r => r.Identifier == identifier && r.Endpoint == endpoint);

            if (rateLimit == null)
            {
                return maxRequests;
            }

            var now = DateTime.UtcNow;
            var windowExpiry = rateLimit.WindowStart.AddMinutes(windowMinutes);

            if (now >= windowExpiry)
            {
                return maxRequests;
            }

            return Math.Max(0, maxRequests - rateLimit.RequestCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API rate limit GetRemainingRequestsAsync failed for {Endpoint} and identifier {Identifier}", endpoint, identifier);
            return maxRequests; // fail-open
        }
    }

    public async Task BlockIdentifierAsync(string identifier, string endpoint, TimeSpan duration)
    {
        try
        {
            var now = DateTime.UtcNow;

            var rateLimit = await _dbContext.ApiRateLimits
                .FirstOrDefaultAsync(r => r.Identifier == identifier && r.Endpoint == endpoint);

            if (rateLimit == null)
            {
                rateLimit = new ApiRateLimit
                {
                    Id = Guid.NewGuid(),
                    Identifier = identifier,
                    Endpoint = endpoint,
                    RequestCount = 999,
                    WindowStart = now,
                    BlockedUntil = now.Add(duration),
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _dbContext.ApiRateLimits.Add(rateLimit);
            }
            else
            {
                rateLimit.BlockedUntil = now.Add(duration);
                rateLimit.UpdatedAt = now;
            }

            await _dbContext.SaveChangesAsync(default);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API rate limit BlockIdentifierAsync failed for {Endpoint} and identifier {Identifier}", endpoint, identifier);
        }
    }

    private async Task CleanupOldRecordsAsync(string endpoint)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddHours(-24);

            var oldRecords = await _dbContext.ApiRateLimits
                .Where(r => r.Endpoint == endpoint && r.CreatedAt < cutoffDate && !r.BlockedUntil.HasValue)
                .ToListAsync();

            if (oldRecords.Any())
            {
                _dbContext.ApiRateLimits.RemoveRange(oldRecords);
                await _dbContext.SaveChangesAsync(default);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API rate limit CleanupOldRecordsAsync failed for {Endpoint}", endpoint);
        }
    }
}
