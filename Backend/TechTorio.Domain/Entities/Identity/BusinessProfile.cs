using TechTorio.Domain.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Entities.Identity;

public class BusinessProfile : AuditableEntity
{
    // The Id property is already defined in the BaseEntity class
    public Guid UserId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string BusinessCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public SellerVerificationStatus VerificationStatus { get; set; } = SellerVerificationStatus.Pending;
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }
    public string? RejectionReason { get; set; }
    
    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
}