using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Exceptions;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteNotificationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(DeleteNotificationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == userId, cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException("Notification", request.NotificationId);
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync(cancellationToken);
    }
}