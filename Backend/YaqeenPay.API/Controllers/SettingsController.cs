using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.Settings.Commands.UpdateSettings;
using YaqeenPay.Application.Features.Settings.Queries.GetAllSettings;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class SettingsController : ApiControllerBase
{
    private readonly ICurrentUserService _currentUserService;

    public SettingsController(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllSettings()
    {
        var query = new GetAllSettingsQuery
        {
            UserId = _currentUserService.UserId
        };

        var result = await Mediator.Send(query);
        return Ok(result);
    }

    [HttpPut("{category}")]
    public async Task<IActionResult> UpdateSettings(SettingsCategory category, [FromBody] object settingsData)
    {
        var command = new UpdateSettingsCommand
        {
            UserId = _currentUserService.UserId,
            Category = category,
            SettingsData = settingsData,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers["User-Agent"].FirstOrDefault()
        };

        var result = await Mediator.Send(command);

        if (result)
        {
            return Ok(new { success = true, message = "Settings updated successfully" });
        }

        return BadRequest(new { success = false, message = "Failed to update settings" });
    }

    [HttpGet("{category}")]
    public async Task<IActionResult> GetSettingsByCategory(SettingsCategory category)
    {
        var query = new GetAllSettingsQuery
        {
            UserId = _currentUserService.UserId
        };

        var allSettings = await Mediator.Send(query);

        // Return specific category settings
        object? categorySettings = category switch
        {
            SettingsCategory.Account => allSettings.Account,
            SettingsCategory.Security => allSettings.Security,
            SettingsCategory.Notifications => allSettings.Notifications,
            SettingsCategory.Payments => allSettings.Payments,
            SettingsCategory.Business => allSettings.Business,
            SettingsCategory.Appearance => allSettings.Appearance,
            SettingsCategory.Integrations => allSettings.Integrations,
            _ => null
        };

        if (categorySettings is null)
        {
            return NotFound(new { success = false, message = "Settings category not found" });
        }

        return Ok(categorySettings);
    }

    [HttpPost("{category}/reset")]
    public async Task<IActionResult> ResetSettings(SettingsCategory category)
    {
        // Create default settings for the category
        object? defaultSettings = category switch
        {
            SettingsCategory.Account => new YaqeenPay.Application.Features.Settings.Common.AccountSettingsDto(),
            SettingsCategory.Security => new YaqeenPay.Application.Features.Settings.Common.SecuritySettingsDto(),
            SettingsCategory.Notifications => new YaqeenPay.Application.Features.Settings.Common.NotificationSettingsDto(),
            SettingsCategory.Payments => new YaqeenPay.Application.Features.Settings.Common.PaymentSettingsDto(),
            SettingsCategory.Business => new YaqeenPay.Application.Features.Settings.Common.BusinessSettingsDto(),
            SettingsCategory.Appearance => new YaqeenPay.Application.Features.Settings.Common.AppearanceSettingsDto(),
            SettingsCategory.Integrations => new YaqeenPay.Application.Features.Settings.Common.IntegrationSettingsDto(),
            _ => null
        };

        if (defaultSettings is null)
        {
            return BadRequest(new { success = false, message = "Invalid settings category" });
        }

        var command = new UpdateSettingsCommand
        {
            UserId = _currentUserService.UserId,
            Category = category,
            SettingsData = defaultSettings,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers["User-Agent"].FirstOrDefault()
        };

        var result = await Mediator.Send(command);

        if (result)
        {
            return Ok(new { success = true, message = "Settings reset to defaults successfully" });
        }

        return BadRequest(new { success = false, message = "Failed to reset settings" });
    }
}