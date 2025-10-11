using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections;
using System.ComponentModel;
using System.Text.Json;
using YaqeenPay.Application.Interfaces;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Infrastructure.Services;

/// <summary>
/// Service that provides configuration values with database overrides
/// Uses IConfiguration as fallback and caches database values for performance
/// </summary>
public class AdminConfigurationService : IAdminConfigurationService
{
    private readonly IAdminSystemSettingsRepository _settingsRepository;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AdminConfigurationService> _logger;
    
    private const string CACHE_KEY_PREFIX = "admin_config:";
    private const string ALL_SETTINGS_CACHE_KEY = "admin_config:all_active";
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(5);

    public AdminConfigurationService(
        IAdminSystemSettingsRepository settingsRepository,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<AdminConfigurationService> logger)
    {
        _settingsRepository = settingsRepository;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetValueAsync<T>(string configKey, T? defaultValue = default)
    {
        try
        {
            // First, try to get from database cache
            var dbValue = await GetDatabaseValueAsync(configKey);
            if (dbValue != null)
            {
                return ConvertValue<T>(dbValue);
            }

            // Fallback to appsettings.json
            var configValue = _configuration[configKey];
            if (!string.IsNullOrEmpty(configValue))
            {
                return ConvertValue<T>(configValue);
            }

            return defaultValue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting configuration value for key: {ConfigKey}", configKey);
            
            // Fallback to appsettings.json on error
            var configValue = _configuration[configKey];
            if (!string.IsNullOrEmpty(configValue))
            {
                try
                {
                    return ConvertValue<T>(configValue);
                }
                catch
                {
                    return defaultValue;
                }
            }
            
            return defaultValue;
        }
    }

    public async Task<string?> GetStringAsync(string configKey, string? defaultValue = null)
    {
        return await GetValueAsync(configKey, defaultValue);
    }

    public async Task<int> GetIntAsync(string configKey, int defaultValue = 0)
    {
        return await GetValueAsync(configKey, defaultValue);
    }

    public async Task<bool> GetBoolAsync(string configKey, bool defaultValue = false)
    {
        return await GetValueAsync(configKey, defaultValue);
    }

    public async Task<decimal> GetDecimalAsync(string configKey, decimal defaultValue = 0m)
    {
        return await GetValueAsync(configKey, defaultValue);
    }

    public async Task RefreshCacheAsync()
    {
        try
        {
            // Remove all cached admin config values
            var cacheField = typeof(MemoryCache).GetField("_coherentState", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            if (cacheField != null)
            {
                var coherentState = cacheField.GetValue(_cache);
                var entriesCollection = coherentState?.GetType()
                    .GetProperty("EntriesCollection", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                
                if (entriesCollection?.GetValue(coherentState) is IDictionary<object, object> entries)
                {
                    var keysToRemove = entries.Keys.Cast<object>()
                        .Where(key => key.ToString()?.StartsWith(CACHE_KEY_PREFIX) == true)
                        .ToList();
                    
                    foreach (var key in keysToRemove)
                    {
                        _cache.Remove(key);
                    }
                }
            }
            
            _logger.LogInformation("Admin configuration cache refreshed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing admin configuration cache");
        }
    }

    public async Task<Dictionary<string, string>> GetCategorySettingsAsync(AdminSettingsCategory category)
    {
        try
        {
            var cacheKey = $"{CACHE_KEY_PREFIX}category:{category}";
            
            if (_cache.TryGetValue(cacheKey, out Dictionary<string, string>? cachedSettings))
            {
                return cachedSettings ?? new Dictionary<string, string>();
            }

            var settings = await _settingsRepository.GetByCategoryAsync(category);
            var result = settings
                .Where(s => s.IsActive)
                .ToDictionary(s => s.SettingKey, s => DecryptIfNeeded(s));

            _cache.Set(cacheKey, result, _cacheExpiration);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category settings for {Category}", category);
            return new Dictionary<string, string>();
        }
    }

    public async Task<bool> HasSettingAsync(string configKey)
    {
        try
        {
            var dbValue = await GetDatabaseValueAsync(configKey);
            return !string.IsNullOrEmpty(dbValue);
        }
        catch
        {
            return false;
        }
    }

    public async Task<T?> GetSectionAsync<T>(string sectionKey) where T : class, new()
    {
        try
        {
            // Get all settings for this section prefix
            var sectionSettings = await GetAllActiveSettingsAsync();
            var relevantSettings = sectionSettings
                .Where(kvp => kvp.Key.StartsWith($"{sectionKey}:", StringComparison.OrdinalIgnoreCase))
                .ToDictionary(
                    kvp => kvp.Key.Substring(sectionKey.Length + 1), // Remove prefix
                    kvp => kvp.Value
                );

            if (relevantSettings.Any())
            {
                // Convert to JSON and deserialize
                var jsonObject = ConvertToNestedJson(relevantSettings);
                return JsonSerializer.Deserialize<T>(jsonObject);
            }

            // Fallback to appsettings.json section
            var section = _configuration.GetSection(sectionKey);
            return section.Exists() ? section.Get<T>() : new T();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting section {SectionKey}", sectionKey);
            
            // Fallback to appsettings.json
            var section = _configuration.GetSection(sectionKey);
            return section.Exists() ? section.Get<T>() : new T();
        }
    }

    private async Task<string?> GetDatabaseValueAsync(string configKey)
    {
        var cacheKey = $"{CACHE_KEY_PREFIX}{configKey}";
        
        if (_cache.TryGetValue(cacheKey, out string? cachedValue))
        {
            return cachedValue;
        }

        var setting = await _settingsRepository.GetByKeyAsync(configKey);
        if (setting?.IsActive == true)
        {
            var value = DecryptIfNeeded(setting);
            _cache.Set(cacheKey, value, _cacheExpiration);
            return value;
        }

        return null;
    }

    private async Task<Dictionary<string, string>> GetAllActiveSettingsAsync()
    {
        if (_cache.TryGetValue(ALL_SETTINGS_CACHE_KEY, out Dictionary<string, string>? cachedSettings))
        {
            return cachedSettings ?? new Dictionary<string, string>();
        }

        var settings = await _settingsRepository.GetActiveSettingsAsync();
        var result = settings.ToDictionary(s => s.SettingKey, s => DecryptIfNeeded(s));

        _cache.Set(ALL_SETTINGS_CACHE_KEY, result, _cacheExpiration);
        return result;
    }

    private string DecryptIfNeeded(Domain.Entities.AdminSystemSettings setting)
    {
        if (setting.IsEncrypted)
        {
            // TODO: Implement decryption using IDataProtectionProvider
            return setting.SettingValue; // For now, return as-is
        }
        
        return setting.SettingValue;
    }

    private T? ConvertValue<T>(string value)
    {
        if (string.IsNullOrEmpty(value))
            return default(T);

        try
        {
            var targetType = typeof(T);
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (underlyingType == typeof(string))
                return (T)(object)value;

            if (underlyingType.IsEnum)
                return (T)Enum.Parse(underlyingType, value, true);

            // Use TypeConverter for complex types
            var converter = TypeDescriptor.GetConverter(underlyingType);
            if (converter.CanConvertFrom(typeof(string)))
            {
                var converted = converter.ConvertFromString(value);
                return converted != null ? (T)converted : default(T);
            }

            // Try JSON deserialization for complex types
            if (underlyingType != typeof(bool) && underlyingType != typeof(int) && 
                underlyingType != typeof(decimal) && underlyingType != typeof(double))
            {
                return JsonSerializer.Deserialize<T>(value);
            }

            return (T)Convert.ChangeType(value, underlyingType);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to convert value '{Value}' to type {Type}", value, typeof(T).Name);
            return default(T);
        }
    }

    private string ConvertToNestedJson(Dictionary<string, string> flatSettings)
    {
        var nested = new Dictionary<string, object>();
        
        foreach (var kvp in flatSettings)
        {
            var keys = kvp.Key.Split(':');
            var current = nested;
            
            for (int i = 0; i < keys.Length - 1; i++)
            {
                if (!current.ContainsKey(keys[i]))
                    current[keys[i]] = new Dictionary<string, object>();
                current = (Dictionary<string, object>)current[keys[i]];
            }
            
            current[keys[^1]] = kvp.Value;
        }
        
        return JsonSerializer.Serialize(nested);
    }
}