using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadCommandHandler : IRequestHandler<MarkAllAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MarkAllAsReadCommandHandler> _logger;

    public MarkAllAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<MarkAllAsReadCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task Handle(MarkAllAsReadCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        _logger.LogInformation("MarkAllAsReadCommand: Starting for user {UserId}", userId);

        var unreadNotifications = await _context.Notifications
            .AsTracking() // Enable change tracking so updates are persisted
            .Where(n => n.UserId == userId && n.Status == NotificationStatus.Unread)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("MarkAllAsReadCommand: Found {Count} unread notifications for user {UserId}", 
            unreadNotifications.Count, userId);

        foreach (var notification in unreadNotifications)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.UtcNow;
            notification.LastModifiedAt = DateTime.UtcNow;
            notification.LastModifiedBy = userId;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("MarkAllAsReadCommand: Successfully marked {Count} notifications as read", 
            unreadNotifications.Count);
    }
}