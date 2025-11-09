using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.UserManagement.Common;

namespace TechTorio.Application.Features.UserManagement.Queries.GetKycDocuments;

public class GetKycDocumentsQueryHandler : IRequestHandler<GetKycDocumentsQuery, List<KycDocumentDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetKycDocumentsQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<List<KycDocumentDto>> Handle(GetKycDocumentsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var documents = await _dbContext.KycDocuments
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. documents.Select(d => new KycDocumentDto
        {
            Id = d.Id,
            DocumentType = d.DocumentType,
            DocumentNumber = d.DocumentNumber,
            DocumentUrl = d.DocumentUrl,
            Status = d.Status,
            RejectionReason = d.RejectionReason,
            VerifiedAt = d.VerifiedAt,
            CreatedAt = d.CreatedAt
        })];
    }
}