using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.CreateNotificationFromOutbox;

public class CreateNotificationFromOutboxCommandHandler : IRequestHandler<CreateNotificationFromOutboxCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateNotificationFromOutboxCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateNotificationFromOutboxCommand request, CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.NotificationType,
            Title = request.Title,
            Message = request.Message,
            Priority = request.Priority,
            Status = NotificationStatus.Unread,
            Metadata = request.Metadata,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = request.UserId, // For system notifications
            IsActive = true
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }
}