using MediatR;
using TechTorio.Application.Features.UserManagement.Common;

namespace TechTorio.Application.Features.UserManagement.Queries.GetKycDocuments;

public class GetKycDocumentsQuery : IRequest<List<KycDocumentDto>>
{
    // Empty query as it will use the current user's identity
}