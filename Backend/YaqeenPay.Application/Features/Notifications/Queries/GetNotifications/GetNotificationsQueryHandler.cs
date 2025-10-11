using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.Notifications.Common;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, NotificationListResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetNotificationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<NotificationListResponseDto> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        // Build query
        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        // Apply filters
        if (request.Type.HasValue)
        {
            query = query.Where(n => n.Type == request.Type.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(n => n.Status == request.Status.Value);
        }

        // Get total count for pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var notificationsRaw = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var notifications = notificationsRaw.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            Priority = n.Priority,
            Status = n.Status,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt,
            UserId = n.UserId,
            Metadata = n.Metadata,
            Actions = !string.IsNullOrEmpty(n.Actions) ? 
                JsonSerializer.Deserialize<List<NotificationActionDto>>(n.Actions) : null
        }).ToList();

        // Calculate statistics
        var allNotifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync(cancellationToken);

        var stats = new NotificationStatsDto
        {
            Total = allNotifications.Count,
            Unread = allNotifications.Count(n => n.Status == NotificationStatus.Unread),
            ByType = allNotifications
                .GroupBy(n => n.Type.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ByPriority = allNotifications
                .GroupBy(n => n.Priority.ToString())
                .ToDictionary(g => g.Key, g => g.Count())
        };

        var pagination = new PaginationDto
        {
            Page = request.Page,
            Limit = request.Limit,
            Total = totalCount,
            HasNext = request.Page * request.Limit < totalCount,
            HasPrev = request.Page > 1
        };

        return new NotificationListResponseDto
        {
            Notifications = notifications,
            Stats = stats,
            Pagination = pagination
        };
    }
}