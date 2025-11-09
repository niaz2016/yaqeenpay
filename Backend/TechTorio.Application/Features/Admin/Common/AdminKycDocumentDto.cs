using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Common;

public class AdminKycDocumentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string? UserFullName { get; set; }
    public KycDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public KycDocumentStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }
    public DateTime CreatedAt { get; internal set; }
}