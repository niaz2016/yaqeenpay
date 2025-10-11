using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(MarkAsReadCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var notifications = await _context.Notifications
            .Where(n => request.NotificationIds.Contains(n.Id) && n.UserId == userId)
            .ToListAsync(cancellationToken);

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
    }
}