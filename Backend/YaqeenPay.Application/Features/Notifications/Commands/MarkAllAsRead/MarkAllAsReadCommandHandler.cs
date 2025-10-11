using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadCommandHandler : IRequestHandler<MarkAllAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkAllAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(MarkAllAsReadCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.Status == NotificationStatus.Unread)
            .ToListAsync(cancellationToken);

        foreach (var notification in unreadNotifications)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.UtcNow;
            notification.LastModifiedAt = DateTime.UtcNow;
            notification.LastModifiedBy = userId;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}