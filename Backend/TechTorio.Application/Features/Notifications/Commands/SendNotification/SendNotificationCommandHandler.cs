using MediatR;
using System.Text.Json;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;

namespace TechTorio.Application.Features.Notifications.Commands.SendNotification;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public SendNotificationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            UserId = request.RecipientId,
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            Priority = request.Priority,
            Metadata = request.Data != null ? JsonSerializer.Serialize(request.Data) : null,
            Actions = request.Actions != null ? JsonSerializer.Serialize(request.Actions) : null,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = request.RecipientId, // For system notifications, this would be the system user
            IsActive = true
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }
}