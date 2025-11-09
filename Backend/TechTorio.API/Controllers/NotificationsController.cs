using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Notifications.Commands.DeleteNotification;
using TechTorio.Application.Features.Notifications.Commands.MarkAllAsRead;
using TechTorio.Application.Features.Notifications.Commands.MarkAsRead;
using TechTorio.Application.Features.Notifications.Commands.SendNotification;
using TechTorio.Application.Features.Notifications.Commands.UpdatePreferences;
using TechTorio.Application.Features.Notifications.Common;
using TechTorio.Application.Features.Notifications.Queries.GetNotifications;
using TechTorio.Application.Features.Notifications.Queries.GetPreferences;
using TechTorio.Domain.Enums;

namespace TechTorio.API.Controllers;

[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ILogger<NotificationsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get notifications for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<NotificationListResponseDto>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] NotificationType? type = null,
        [FromQuery] NotificationStatus? status = null)
    {
        var query = new GetNotificationsQuery
        {
            Page = page,
            Limit = limit,
            Type = type,
            Status = status
        };

        var result = await Mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Send a notification (for system/admin use)
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<Guid>> SendNotification([FromBody] SendNotificationDto request)
    {
        var command = new SendNotificationCommand
        {
            RecipientId = request.RecipientId,
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            Priority = request.Priority,
            Data = request.Data,
            Actions = request.Actions
        };

        var notificationId = await Mediator.Send(command);
        return Ok(notificationId);
    }

    /// <summary>
    /// Mark specific notifications as read
    /// </summary>
    [HttpPut("mark-read")]
    public async Task<ActionResult> MarkAsRead([FromBody] MarkAsReadRequestDto request)
    {
        var command = new MarkAsReadCommand
        {
            NotificationIds = request.NotificationIds
        };

        await Mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Mark all notifications as read for the current user
    /// </summary>
    [HttpPut("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var command = new MarkAllAsReadCommand();
        await Mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Delete a specific notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<ActionResult> DeleteNotification(Guid notificationId)
    {
        var command = new DeleteNotificationCommand
        {
            NotificationId = notificationId
        };

        await Mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Delete multiple notifications
    /// </summary>
    [HttpDelete("bulk")]
    public async Task<ActionResult> DeleteMultiple([FromBody] DeleteMultipleRequestDto request)
    {
        foreach (var notificationId in request.NotificationIds)
        {
            var command = new DeleteNotificationCommand
            {
                NotificationId = notificationId
            };

            await Mediator.Send(command);
        }

        return NoContent();
    }

    /// <summary>
    /// Get notification preferences for the current user
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferencesDto>> GetPreferences()
    {
        var query = new GetNotificationPreferencesQuery();
        var result = await Mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Update notification preferences for the current user
    /// </summary>
    [HttpPut("preferences")]
    public async Task<ActionResult<NotificationPreferencesDto>> UpdatePreferences([FromBody] UpdateNotificationPreferencesCommand request)
    {
        var result = await Mediator.Send(request);
        return Ok(result);
    }
}

// Request DTOs
public class MarkAsReadRequestDto
{
    public List<Guid> NotificationIds { get; set; } = new();
}

public class DeleteMultipleRequestDto
{
    public List<Guid> NotificationIds { get; set; } = new();
}