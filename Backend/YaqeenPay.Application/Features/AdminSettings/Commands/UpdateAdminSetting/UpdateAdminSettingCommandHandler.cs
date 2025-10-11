using MediatR;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Features.AdminSettings.Common;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Application.Features.AdminSettings.Commands.UpdateAdminSetting;

public class UpdateAdminSettingCommandHandler : IRequestHandler<UpdateAdminSettingCommand, AdminSettingsOperationResult>
{
    private readonly IAdminSystemSettingsRepository _settingsRepository;
    private readonly IAdminSettingsAuditRepository _auditRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<UpdateAdminSettingCommandHandler> _logger;

    public UpdateAdminSettingCommandHandler(
        IAdminSystemSettingsRepository settingsRepository,
        IAdminSettingsAuditRepository auditRepository,
        ICurrentUserService currentUserService,
        ILogger<UpdateAdminSettingCommandHandler> logger)
    {
        _settingsRepository = settingsRepository;
        _auditRepository = auditRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<AdminSettingsOperationResult> Handle(UpdateAdminSettingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Find existing setting
            var existingSetting = await _settingsRepository.GetByKeyAsync(request.SettingKey, cancellationToken);
            if (existingSetting == null)
            {
                return new AdminSettingsOperationResult
                {
                    Success = false,
                    Message = $"Setting with key '{request.SettingKey}' not found.",
                    Errors = new List<string> { "SETTING_NOT_FOUND" }
                };
            }

            // Validate new value
            var validationResult = ValidateSettingValue(request.SettingValue, existingSetting.DataType, existingSetting.ValidationRules);
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
            var oldValue = existingSetting.SettingValue;

            // Update setting
            existingSetting.SettingValue = request.SettingValue;
            existingSetting.LastModifiedAt = DateTime.UtcNow;
            existingSetting.ModifiedByUserId = userId;

            // Encrypt value if needed
            if (existingSetting.IsEncrypted)
            {
                existingSetting.SettingValue = EncryptValue(existingSetting.SettingValue);
            }

            await _settingsRepository.UpdateAsync(existingSetting, cancellationToken);

            // Create audit record
            var audit = new AdminSettingsAudit
            {
                Id = Guid.NewGuid(),
                SettingKey = request.SettingKey,
                Category = existingSetting.Category,
                OldValue = existingSetting.IsSensitive ? "***MASKED***" : oldValue,
                NewValue = existingSetting.IsSensitive ? "***MASKED***" : request.SettingValue,
                ChangeType = "Updated",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId,
                IpAddress = request.IpAddress,
                UserAgent = request.UserAgent,
                Notes = request.Notes
            };

            await _auditRepository.AddAsync(audit, cancellationToken);

            _logger.LogInformation("Admin setting updated: {SettingKey} by user {UserId}", 
                request.SettingKey, userId);

            var settingDto = MapToDto(existingSetting);
            
            return new AdminSettingsOperationResult
            {
                Success = true,
                Message = "Setting updated successfully.",
                Setting = settingDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating admin setting {SettingKey}", request.SettingKey);
            
            return new AdminSettingsOperationResult
            {
                Success = false,
                Message = "An error occurred while updating the setting.",
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