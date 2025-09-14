using MediatR;
using YaqeenPay.Application.Features.Admin.Common;

namespace YaqeenPay.Application.Features.Admin.Queries.GetPendingKycDocuments;

public class GetPendingKycDocumentsQuery : IRequest<List<AdminKycDocumentDto>>
{
    // Empty query
}