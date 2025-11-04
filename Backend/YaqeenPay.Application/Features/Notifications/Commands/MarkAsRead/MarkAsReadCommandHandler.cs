using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MarkAsReadCommandHandler> _logger;

    public MarkAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<MarkAsReadCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task Handle(MarkAsReadCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        _logger.LogInformation("MarkAsReadCommand: Starting for user {UserId}, IDs: {NotificationIds}", 
            userId, string.Join(", ", request.NotificationIds));

        var notifications = await _context.Notifications
            .AsTracking() // Enable change tracking so updates are persisted
            .Where(n => request.NotificationIds.Contains(n.Id) && n.UserId == userId)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("MarkAsReadCommand: Found {Count} notifications to mark as read", notifications.Count);

        foreach (var notification in notifications)
        {
            if (notification.Status == NotificationStatus.Unread)
            {
                notification.Status = NotificationStatus.Read;
                notification.ReadAt = DateTime.UtcNow;
                notification.LastModifiedAt = DateTime.UtcNow;
                notification.LastModifiedBy = userId;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("MarkAsReadCommand: Successfully marked {Count} notifications as read", 
            notifications.Count);
    }
}