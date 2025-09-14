using MediatR;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Admin.Commands.VerifyKycDocument;

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