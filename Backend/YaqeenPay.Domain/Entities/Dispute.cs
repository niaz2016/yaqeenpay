using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Entities
{
    public class Dispute : AuditableEntity
    {
        public Guid OrderId { get; private set; }
        public Guid RaisedById { get; private set; }
        public DisputeStatus Status { get; private set; }
        public string Reason { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public string? Evidence { get; private set; }
        public string? AdminNotes { get; private set; }
        public DateTime? ResolvedAt { get; private set; }
        public Guid ResolvedById { get; private set; }
        public DisputeResolution? Resolution { get; private set; }

        // Navigation properties
        public virtual Order Order { get; private set; } = null!;
        public virtual Domain.Entities.Identity.ApplicationUser RaisedBy { get; private set; } = null!;
        public virtual Domain.Entities.Identity.ApplicationUser? ResolvedBy { get; private set; }

        private Dispute() { } // For EF Core

        public Dispute(Guid orderId, Guid raisedById, string reason, string description, string? evidence = null)
        {
            OrderId = orderId;
            RaisedById = raisedById;
            Reason = reason;
            Description = description;
            Evidence = evidence;
            Status = DisputeStatus.Open;
        }

        public void UpdateEvidence(string evidence)
        {
            Evidence = evidence;
        }

        public void AddAdminNotes(string notes)
        {
            AdminNotes = notes;
        }

        public void Escalate()
        {
            if (Status != DisputeStatus.Open)
                throw new InvalidOperationException($"Cannot escalate dispute in status {Status}");
            
            Status = DisputeStatus.Escalated;
        }

        public void ResolveInFavorOfBuyer(Guid resolvedById, string notes)
        {
            if (Status == DisputeStatus.Resolved)
                throw new InvalidOperationException("Dispute is already resolved");
            
            Status = DisputeStatus.Resolved;
            Resolution = DisputeResolution.InFavorOfBuyer;
            ResolvedById = resolvedById;
            ResolvedAt = DateTime.UtcNow;
            AdminNotes = notes;
        }

        public void ResolveInFavorOfSeller(Guid resolvedById, string notes)
        {
            if (Status == DisputeStatus.Resolved)
                throw new InvalidOperationException("Dispute is already resolved");
            
            Status = DisputeStatus.Resolved;
            Resolution = DisputeResolution.InFavorOfSeller;
            ResolvedById = resolvedById;
            ResolvedAt = DateTime.UtcNow;
            AdminNotes = notes;
        }

        public void Close()
        {
            if (Status == DisputeStatus.Closed || Status == DisputeStatus.Resolved)
                throw new InvalidOperationException($"Cannot close dispute in status {Status}");
            
            Status = DisputeStatus.Closed;
        }
    }
}