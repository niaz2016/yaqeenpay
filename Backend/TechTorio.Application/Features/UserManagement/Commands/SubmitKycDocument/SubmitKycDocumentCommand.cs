using MediatR;
using TechTorio.Application.Features.UserManagement.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Commands.SubmitKycDocument;

public class SubmitKycDocumentCommand : IRequest<KycDocumentDto>
{
    public KycDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentBase64 { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}