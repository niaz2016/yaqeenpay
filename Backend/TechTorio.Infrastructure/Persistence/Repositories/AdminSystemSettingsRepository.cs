using Microsoft.EntityFrameworkCore;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using TechTorio.Domain.Interfaces;
using TechTorio.Infrastructure.Persistence;

namespace TechTorio.Infrastructure.Persistence.Repositories;

public class AdminSystemSettingsRepository : IAdminSystemSettingsRepository
{
    private readonly ApplicationDbContext _context;

    public AdminSystemSettingsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSystemSettings?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSystemSettings>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .OrderBy(s => s.Category)
            .ThenBy(s => s.SettingKey)
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminSystemSettings> AddAsync(AdminSystemSettings entity, CancellationToken cancellationToken = default)
    {
        _context.AdminSystemSettings.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task UpdateAsync(AdminSystemSettings entity, CancellationToken cancellationToken = default)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(AdminSystemSettings entity, CancellationToken cancellationToken = default)
    {
        _context.AdminSystemSettings.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<AdminSystemSettings?> GetByKeyAsync(string settingKey, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .FirstOrDefaultAsync(s => s.SettingKey == settingKey, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSystemSettings>> GetByCategoryAsync(AdminSettingsCategory category, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .Where(s => s.Category == category)
            .OrderBy(s => s.SettingKey)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSystemSettings>> GetActiveSettingsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .Where(s => s.IsActive)
            .OrderBy(s => s.Category)
            .ThenBy(s => s.SettingKey)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSystemSettings>> GetByKeyPrefixAsync(string keyPrefix, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .Include(s => s.ModifiedByUser)
            .Where(s => s.SettingKey.StartsWith(keyPrefix))
            .OrderBy(s => s.SettingKey)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(string settingKey, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSystemSettings
            .AnyAsync(s => s.SettingKey == settingKey, cancellationToken);
    }

    public async Task BulkUpdateAsync(IEnumerable<AdminSystemSettings> settings, CancellationToken cancellationToken = default)
    {
        foreach (var setting in settings)
        {
            _context.Entry(setting).State = EntityState.Modified;
        }
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class AdminSettingsAuditRepository : IAdminSettingsAuditRepository
{
    private readonly ApplicationDbContext _context;

    public AdminSettingsAuditRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSettingsAudit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSettingsAudit>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .OrderByDescending(a => a.ChangedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminSettingsAudit> AddAsync(AdminSettingsAudit entity, CancellationToken cancellationToken = default)
    {
        _context.AdminSettingsAudits.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task UpdateAsync(AdminSettingsAudit entity, CancellationToken cancellationToken = default)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(AdminSettingsAudit entity, CancellationToken cancellationToken = default)
    {
        _context.AdminSettingsAudits.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSettingsAudit>> GetBySettingKeyAsync(string settingKey, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .Where(a => a.SettingKey == settingKey)
            .OrderByDescending(a => a.ChangedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSettingsAudit>> GetByCategoryAsync(AdminSettingsCategory category, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .Where(a => a.Category == category)
            .OrderByDescending(a => a.ChangedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSettingsAudit>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .Where(a => a.ChangedByUserId == userId)
            .OrderByDescending(a => a.ChangedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminSettingsAudit>> GetRecentChangesAsync(int days = 30, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        return await _context.AdminSettingsAudits
            .Include(a => a.ChangedByUser)
            .Where(a => a.ChangedAt >= cutoffDate)
            .OrderByDescending(a => a.ChangedAt)
            .ToListAsync(cancellationToken);
    }
}