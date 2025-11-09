using TechTorio.Domain.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Entities.Identity;

public class KycDocument : AuditableEntity
{
    // The Id property is already defined in the BaseEntity class
    public Guid UserId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public KycDocumentType DocumentType { get; set; }
    public string DocumentUrl { get; set; } = string.Empty;
    public KycDocumentStatus Status { get; set; } = KycDocumentStatus.Pending;
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}