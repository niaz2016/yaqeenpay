using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Interfaces;

public interface IAdminSystemSettingsRepository : IRepository<AdminSystemSettings>
{
    /// <summary>
    /// Get setting by key
    /// </summary>
    Task<AdminSystemSettings?> GetByKeyAsync(string settingKey, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get all settings by category
    /// </summary>
    Task<IReadOnlyList<AdminSystemSettings>> GetByCategoryAsync(AdminSettingsCategory category, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get all active settings
    /// </summary>
    Task<IReadOnlyList<AdminSystemSettings>> GetActiveSettingsAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get all settings with their keys matching a pattern
    /// </summary>
    Task<IReadOnlyList<AdminSystemSettings>> GetByKeyPrefixAsync(string keyPrefix, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Check if a setting exists
    /// </summary>
    Task<bool> ExistsAsync(string settingKey, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Bulk update multiple settings
    /// </summary>
    Task BulkUpdateAsync(IEnumerable<AdminSystemSettings> settings, CancellationToken cancellationToken = default);
}

public interface IAdminSettingsAuditRepository : IRepository<AdminSettingsAudit>
{
    /// <summary>
    /// Get audit trail for a specific setting
    /// </summary>
    Task<IReadOnlyList<AdminSettingsAudit>> GetBySettingKeyAsync(string settingKey, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get audit trail by category
    /// </summary>
    Task<IReadOnlyList<AdminSettingsAudit>> GetByCategoryAsync(AdminSettingsCategory category, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get audit trail by user
    /// </summary>
    Task<IReadOnlyList<AdminSettingsAudit>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get recent changes (last N days)
    /// </summary>
    Task<IReadOnlyList<AdminSettingsAudit>> GetRecentChangesAsync(int days = 30, CancellationToken cancellationToken = default);
}