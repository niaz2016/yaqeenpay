using MediatR;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Commands.ApplyForSellerRole;

public class ApplyForSellerRoleCommand : IRequest<SellerRegistrationResponse>
{
    // Step 1: Basic seller info
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string BusinessCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Step 2: Contact info
    public string PhoneNumber { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    // Step 3: Document info
    public string TaxId { get; set; } = string.Empty;
    public List<KycDocumentSubmission> Documents { get; set; } = new();
}

public class KycDocumentSubmission
{
    public KycDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentBase64 { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class SellerRegistrationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? BusinessProfileId { get; set; }
    public Guid? UserId { get; set; }
    public SellerVerificationStatus Status { get; set; }
    public List<string> Roles { get; set; } = new();
}