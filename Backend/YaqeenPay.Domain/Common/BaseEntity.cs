
namespace YaqeenPay.Domain.Common
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; }
        public bool IsActive { get; set; }
    }

    public abstract class AuditableEntity : BaseEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedBy { get; set; }
        public DateTime? LastModifiedAt { get; set; }
        public Guid LastModifiedBy { get; set; }
    }
}