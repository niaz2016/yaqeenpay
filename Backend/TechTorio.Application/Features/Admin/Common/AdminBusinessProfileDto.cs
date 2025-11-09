using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Common;
public class UserDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class AdminBusinessProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string? UserFullName { get; set; }
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
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }
    public DateTime SubmissionDate { get; set; }
    public KycStatus UserKycStatus { get; set; }
    public UserDto User { get; set; } = new UserDto();
}