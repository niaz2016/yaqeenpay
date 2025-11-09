using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Services;

public class SmsRateLimitService : ISmsRateLimitService
{
    private readonly IApplicationDbContext _dbContext;
    private const int MaxAttemptsPerDay = 3;
    private const int BlockDurationHours = 24;

    public SmsRateLimitService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsAllowedAsync(string deviceIdentifier, string phoneNumber)
    {
        var now = DateTime.UtcNow;
        
        // Clean up old records (older than 24 hours)
        await CleanupOldRecordsAsync();

        var rateLimit = await _dbContext.SmsRateLimits
            .FirstOrDefaultAsync(r => r.DeviceIdentifier == deviceIdentifier);

        if (rateLimit == null)
        {
            return true; // No record, allow
        }

        // Check if blocked
        if (rateLimit.BlockedUntil.HasValue && rateLimit.BlockedUntil.Value > now)
        {
            return false; // Still blocked
        }

        // Check if 24 hours have passed since first attempt
        var hoursSinceFirstAttempt = (now - rateLimit.FirstAttemptAt).TotalHours;
        if (hoursSinceFirstAttempt >= 24)
        {
            // Reset the counter after 24 hours
            rateLimit.AttemptCount = 0;
            rateLimit.FirstAttemptAt = now;
            rateLimit.BlockedUntil = null;
            rateLimit.UpdatedAt = now;
            await _dbContext.SaveChangesAsync(default);
            return true;
        }

        // Check if exceeded max attempts
        if (rateLimit.AttemptCount >= MaxAttemptsPerDay)
        {
            return false; // Exceeded limit
        }

        return true; // Allowed
    }

    public async Task RecordAttemptAsync(string deviceIdentifier, string phoneNumber)
    {
        var now = DateTime.UtcNow;
        
        var rateLimit = await _dbContext.SmsRateLimits
            .FirstOrDefaultAsync(r => r.DeviceIdentifier == deviceIdentifier);

        if (rateLimit == null)
        {
            // Create new record
            rateLimit = new SmsRateLimit
            {
                Id = Guid.NewGuid(),
                DeviceIdentifier = deviceIdentifier,
                PhoneNumber = phoneNumber,
                AttemptCount = 1,
                FirstAttemptAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.SmsRateLimits.Add(rateLimit);
        }
        else
        {
            // Check if 24 hours have passed
            var hoursSinceFirstAttempt = (now - rateLimit.FirstAttemptAt).TotalHours;
            if (hoursSinceFirstAttempt >= 24)
            {
                // Reset counter
                rateLimit.AttemptCount = 1;
                rateLimit.FirstAttemptAt = now;
                rateLimit.BlockedUntil = null;
            }
            else
            {
                // Increment counter
                rateLimit.AttemptCount++;
                
                // Block if exceeded limit
                if (rateLimit.AttemptCount >= MaxAttemptsPerDay)
                {
                    rateLimit.BlockedUntil = rateLimit.FirstAttemptAt.AddHours(BlockDurationHours);
                }
            }
            
            rateLimit.PhoneNumber = phoneNumber;
            rateLimit.UpdatedAt = now;
        }

        await _dbContext.SaveChangesAsync(default);
    }

    public async Task<int> GetRemainingAttemptsAsync(string deviceIdentifier)
    {
        var rateLimit = await _dbContext.SmsRateLimits
            .FirstOrDefaultAsync(r => r.DeviceIdentifier == deviceIdentifier);

        if (rateLimit == null)
        {
            return MaxAttemptsPerDay;
        }

        var now = DateTime.UtcNow;
        var hoursSinceFirstAttempt = (now - rateLimit.FirstAttemptAt).TotalHours;
        
        if (hoursSinceFirstAttempt >= 24)
        {
            return MaxAttemptsPerDay;
        }

        return Math.Max(0, MaxAttemptsPerDay - rateLimit.AttemptCount);
    }

    public async Task<TimeSpan?> GetBlockDurationAsync(string deviceIdentifier)
    {
        var rateLimit = await _dbContext.SmsRateLimits
            .FirstOrDefaultAsync(r => r.DeviceIdentifier == deviceIdentifier);

        if (rateLimit == null || !rateLimit.BlockedUntil.HasValue)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        if (rateLimit.BlockedUntil.Value <= now)
        {
            return null; // Block expired
        }

        return rateLimit.BlockedUntil.Value - now;
    }

    private async Task CleanupOldRecordsAsync()
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-2); // Keep records for 2 days
        
        var oldRecords = await _dbContext.SmsRateLimits
            .Where(r => r.CreatedAt < cutoffDate)
            .ToListAsync();

        if (oldRecords.Any())
        {
            _dbContext.SmsRateLimits.RemoveRange(oldRecords);
            await _dbContext.SaveChangesAsync(default);
        }
    }
}
