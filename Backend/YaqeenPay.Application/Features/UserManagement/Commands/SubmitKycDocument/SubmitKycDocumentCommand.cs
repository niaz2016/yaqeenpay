using MediatR;
using YaqeenPay.Application.Features.UserManagement.Common;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.UserManagement.Commands.SubmitKycDocument;

public class SubmitKycDocumentCommand : IRequest<KycDocumentDto>
{
    public KycDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentBase64 { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}