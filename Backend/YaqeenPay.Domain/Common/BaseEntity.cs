
namespace YaqeenPay.Domain.Common
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; }
        // Default entities to active unless explicitly deactivated. This prevents NOT NULL violations
        // when new entities forget to set the flag (e.g., Notifications created by background jobs).
        public bool IsActive { get; set; } = true;
    }

    public abstract class AuditableEntity : BaseEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedBy { get; set; }
        public DateTime? LastModifiedAt { get; set; }
        public Guid LastModifiedBy { get; set; }
    }
}