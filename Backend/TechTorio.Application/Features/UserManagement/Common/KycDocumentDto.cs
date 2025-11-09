using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Common;

public class KycDocumentDto
{
    public Guid Id { get; set; }
    public KycDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public KycDocumentStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}