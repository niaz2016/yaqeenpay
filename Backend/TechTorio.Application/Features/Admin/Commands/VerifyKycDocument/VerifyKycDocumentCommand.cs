using MediatR;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Commands.VerifyKycDocument;

public class VerifyKycDocumentCommand : IRequest<VerifyKycDocumentResponse>
{
    public Guid DocumentId { get; set; }
    public KycDocumentStatus Status { get; set; }
    public string? RejectionReason { get; set; }
}

public class VerifyKycDocumentResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
    public KycDocumentStatus Status { get; set; }
}