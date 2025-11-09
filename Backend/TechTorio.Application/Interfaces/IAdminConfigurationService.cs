using TechTorio.Application.Features.AdminSettings.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Interfaces;

/// <summary>
/// Service for dynamically overriding configuration settings from database
/// </summary>
public interface IAdminConfigurationService
{
    /// <summary>
    /// Get a configuration value, checking database overrides first
    /// </summary>
    Task<T?> GetValueAsync<T>(string configKey, T? defaultValue = default);
    
    /// <summary>
    /// Get a configuration value as string
    /// </summary>
    Task<string?> GetStringAsync(string configKey, string? defaultValue = null);
    
    /// <summary>
    /// Get a configuration value as int
    /// </summary>
    Task<int> GetIntAsync(string configKey, int defaultValue = 0);
    
    /// <summary>
    /// Get a configuration value as bool
    /// </summary>
    Task<bool> GetBoolAsync(string configKey, bool defaultValue = false);
    
    /// <summary>
    /// Get a configuration value as decimal
    /// </summary>
    Task<decimal> GetDecimalAsync(string configKey, decimal defaultValue = 0m);
    
    /// <summary>
    /// Refresh the configuration cache
    /// </summary>
    Task RefreshCacheAsync();
    
    /// <summary>
    /// Get all active settings for a category
    /// </summary>
    Task<Dictionary<string, string>> GetCategorySettingsAsync(AdminSettingsCategory category);
    
    /// <summary>
    /// Check if a setting exists in the database
    /// </summary>
    Task<bool> HasSettingAsync(string configKey);
    
    /// <summary>
    /// Get strongly typed configuration section
    /// </summary>
    Task<T?> GetSectionAsync<T>(string sectionKey) where T : class, new();
}