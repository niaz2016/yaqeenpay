using MediatR;
using TechTorio.Application.Features.Admin.Common;

namespace TechTorio.Application.Features.Admin.Queries.GetPendingKycDocuments;

public class GetPendingKycDocumentsQuery : IRequest<List<AdminKycDocumentDto>>
{
    // Empty query
}