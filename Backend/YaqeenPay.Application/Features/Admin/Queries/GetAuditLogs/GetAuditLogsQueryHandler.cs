using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Admin.Queries.GetAuditLogs
{
    public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, List<AuditLogDto>>
    {
        private readonly IApplicationDbContext _dbContext;
        public GetAuditLogsQueryHandler(IApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
        {
            var query = _dbContext.AuditLogs.AsQueryable();
            if (request.UserId.HasValue)
                query = query.Where(a => a.UserId == request.UserId);
            if (!string.IsNullOrEmpty(request.Action))
                query = query.Where(a => a.Action == request.Action);
            if (!string.IsNullOrEmpty(request.EntityType))
                query = query.Where(a => a.EntityType == request.EntityType);
            if (request.EntityId.HasValue)
                query = query.Where(a => a.EntityId == request.EntityId);
            if (request.From.HasValue)
                query = query.Where(a => a.Timestamp >= request.From);
            if (request.To.HasValue)
                query = query.Where(a => a.Timestamp <= request.To);

            return await query.OrderByDescending(a => a.Timestamp)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Details = a.Details,
                    Timestamp = a.Timestamp
                })
                .ToListAsync(cancellationToken);
        }
    }
}