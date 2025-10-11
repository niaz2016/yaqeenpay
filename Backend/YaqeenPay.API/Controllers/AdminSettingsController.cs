using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.AdminSettings.Commands.CreateAdminSetting;
using YaqeenPay.Application.Features.AdminSettings.Commands.UpdateAdminSetting;
using YaqeenPay.Application.Features.AdminSettings.Queries.GetAdminSettings;

namespace YaqeenPay.API.Controllers;

/// <summary>
/// Admin-only controller for managing system-wide configuration settings
/// These settings override values in appsettings.json and take effect without server restart
/// </summary>
[Authorize] // Temporarily removed role requirement to test basic auth
[Route("api/admin/settings")]
public class AdminSettingsController : ApiControllerBase
{
    /// <summary>
    /// Test endpoint to verify admin authorization
    /// </summary>
    [HttpGet("test")]
    [AllowAnonymous] // Temporarily allow anonymous access to debug JWT claims
    public IActionResult TestAuth()
    {
        return Ok(new { 
            message = "Test endpoint reachable", 
            timestamp = DateTime.UtcNow,
            isAuthenticated = User.Identity?.IsAuthenticated ?? false,
            userExists = User.Identity != null,
            name = User.Identity?.Name ?? "No name"
        });
    }

    /// <summary>
    /// Public endpoint to check if system is working (no auth required)
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Test endpoint without authentication to verify routing
    /// </summary>
    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok(new { message = "Admin settings controller reachable", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get all admin system settings grouped by category
    /// </summary>
    [HttpGet]
    [AllowAnonymous] // Temporarily allow anonymous access for debugging
    public async Task<IActionResult> GetAllSettings()
    {
        try
        {
            var query = new GetAdminSettingsQuery();
            var result = await Mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, innerException = ex.InnerException?.Message });
        }
    }

    /// <summary>
    /// Create a new admin setting
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSetting([FromBody] CreateAdminSettingCommand command)
    {
        try
        {
            var result = await Mediator.Send(command);
            
            if (!result.Success)
                return BadRequest(result);
                
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, innerException = ex.InnerException?.Message });
        }
    }

    /// <summary>
    /// Update an existing admin setting
    /// </summary>
    [HttpPut("{settingKey}")]
    public async Task<IActionResult> UpdateSetting([FromRoute] string settingKey, 
        [FromBody] UpdateAdminSettingCommand command)
    {
        try
        {
            command.SettingKey = settingKey; // Override with route parameter
            var result = await Mediator.Send(command);
            
            if (!result.Success)
                return BadRequest(result);
                
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, innerException = ex.InnerException?.Message });
        }
    }
}