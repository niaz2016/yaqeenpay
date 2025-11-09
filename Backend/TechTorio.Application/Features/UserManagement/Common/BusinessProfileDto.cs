using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Common;

public class BusinessProfileDto
{
    public Guid Id { get; set; }
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
    public SellerVerificationStatus VerificationStatus { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}