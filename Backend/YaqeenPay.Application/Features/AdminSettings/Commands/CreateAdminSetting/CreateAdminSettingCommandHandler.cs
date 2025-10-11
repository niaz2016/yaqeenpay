using MediatR;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Features.AdminSettings.Common;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Interfaces;
using System.Text.Json;

namespace YaqeenPay.Application.Features.AdminSettings.Commands.CreateAdminSetting;

public class CreateAdminSettingCommandHandler : IRequestHandler<CreateAdminSettingCommand, AdminSettingsOperationResult>
{
    private readonly IAdminSystemSettingsRepository _settingsRepository;
    private readonly IAdminSettingsAuditRepository _auditRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<CreateAdminSettingCommandHandler> _logger;

    public CreateAdminSettingCommandHandler(
        IAdminSystemSettingsRepository settingsRepository,
        IAdminSettingsAuditRepository auditRepository,
        ICurrentUserService currentUserService,
        ILogger<CreateAdminSettingCommandHandler> logger)
    {
        _settingsRepository = settingsRepository;
        _auditRepository = auditRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<AdminSettingsOperationResult> Handle(CreateAdminSettingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate setting doesn't already exist
            var existingSetting = await _settingsRepository.GetByKeyAsync(request.SettingKey, cancellationToken);
            if (existingSetting != null)
            {
                return new AdminSettingsOperationResult
                {
                    Success = false,
                    Message = $"Setting with key '{request.SettingKey}' already exists.",
                    Errors = new List<string> { "DUPLICATE_SETTING_KEY" }
                };
            }

            // Validate setting value based on data type
            var validationResult = ValidateSettingValue(request.SettingValue, request.DataType, request.ValidationRules);
            if (!validationResult.IsValid)
            {
                return new AdminSettingsOperationResult
                {
                    Success = false,
                    Message = "Invalid setting value.",
                    Errors = validationResult.Errors
                };
            }

            var userId = _currentUserService.UserId;
            
            // Validate that we have a valid user ID
            if (userId == Guid.Empty)
            {
                return new AdminSettingsOperationResult
                {
                    Success = false,
                    Message = "User authentication required to create settings.",
                    Errors = new List<string> { "INVALID_USER_ID" }
                };
            }
            
            // Create new setting
            var newSetting = new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = request.SettingKey.Trim(),
                SettingValue = request.SettingValue,
                DataType = request.DataType.ToLowerInvariant(),
                Category = request.Category,
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                IsEncrypted = request.IsEncrypted,
                IsSensitive = request.IsSensitive,
                DefaultValue = request.DefaultValue,
                ValidationRules = request.ValidationRules,
                ModifiedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            };

            // Encrypt value if needed
            if (request.IsEncrypted)
            {
                newSetting.SettingValue = EncryptValue(newSetting.SettingValue);
            }

            await _settingsRepository.AddAsync(newSetting, cancellationToken);

            // Create audit record
            var audit = new AdminSettingsAudit
            {
                Id = Guid.NewGuid(),
                SettingKey = request.SettingKey,
                Category = request.Category,
                OldValue = null,
                NewValue = request.IsSensitive ? "***MASKED***" : request.SettingValue,
                ChangeType = "Created",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId,
                IpAddress = request.IpAddress,
                UserAgent = request.UserAgent,
                Notes = request.Notes
            };

            await _auditRepository.AddAsync(audit, cancellationToken);

            _logger.LogInformation("Admin setting created: {SettingKey} by user {UserId}", 
                request.SettingKey, userId);

            var settingDto = MapToDto(newSetting);
            
            return new AdminSettingsOperationResult
            {
                Success = true,
                Message = "Setting created successfully.",
                Setting = settingDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating admin setting {SettingKey}", request.SettingKey);
            
            return new AdminSettingsOperationResult
            {
                Success = false,
                Message = "An error occurred while creating the setting.",
                Errors = new List<string> { "INTERNAL_ERROR" }
            };
        }
    }

    private (bool IsValid, List<string> Errors) ValidateSettingValue(string value, string dataType, string? validationRules)
    {
        var errors = new List<string>();
        
        try
        {
            switch (dataType.ToLowerInvariant())
            {
                case "int":
                case "integer":
                    if (!int.TryParse(value, out _))
                        errors.Add("Value must be a valid integer.");
                    break;
                    
                case "decimal":
                case "double":
                case "float":
                    if (!decimal.TryParse(value, out _))
                        errors.Add("Value must be a valid decimal number.");
                    break;
                    
                case "bool":
                case "boolean":
                    if (!bool.TryParse(value, out _))
                        errors.Add("Value must be true or false.");
                    break;
                    
                case "json":
                    try
                    {
                        JsonDocument.Parse(value);
                    }
                    catch
                    {
                        errors.Add("Value must be valid JSON.");
                    }
                    break;
            }

            // Additional validation rules
            if (!string.IsNullOrEmpty(validationRules))
            {
                // TODO: Implement custom validation rules parsing
                // This could include regex patterns, min/max values, etc.
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Validation error: {ex.Message}");
        }

        return (errors.Count == 0, errors);
    }

    private string EncryptValue(string value)
    {
        // TODO: Implement proper encryption using IDataProtectionProvider
        // For now, just return the value (implement this based on your encryption strategy)
        return value;
    }

    private AdminSystemSettingsDto MapToDto(AdminSystemSettings setting)
    {
        return new AdminSystemSettingsDto
        {
            Id = setting.Id,
            SettingKey = setting.SettingKey,
            SettingValue = setting.IsSensitive ? "***MASKED***" : setting.SettingValue,
            DataType = setting.DataType,
            Category = setting.Category,
            Description = setting.Description,
            IsActive = setting.IsActive,
            IsEncrypted = setting.IsEncrypted,
            IsSensitive = setting.IsSensitive,
            DefaultValue = setting.DefaultValue,
            ValidationRules = setting.ValidationRules,
            ModifiedByUserId = setting.ModifiedByUserId,
            CreatedAt = setting.CreatedAt,
            LastModifiedAt = setting.LastModifiedAt
        };
    }
}