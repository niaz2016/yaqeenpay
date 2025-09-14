using System;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Common.Models
{
    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}