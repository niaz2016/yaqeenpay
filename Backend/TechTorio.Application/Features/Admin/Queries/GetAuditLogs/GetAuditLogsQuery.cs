using MediatR;
using System;
using System.Collections.Generic;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Admin.Queries.GetAuditLogs
{
    public class GetAuditLogsQuery : IRequest<List<AuditLogDto>>
    {
        public Guid? UserId { get; set; }
        public string? Action { get; set; }
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }
}