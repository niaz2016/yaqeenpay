using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using System.Security.Claims;

namespace TechTorio.Application.Features.Disputes.Queries.GetDisputesList;

public class GetDisputesListQuery : IRequest<PaginatedList<DisputeDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

public class DisputeDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public Guid RaisedById { get; set; }
    public string RaisedByName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; }
    public DateTime Created { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DisputeResolution? Resolution { get; set; }
    public DateTime CreatedAt { get; internal set; }
    public Guid CreatedBy { get; internal set; }
    public Guid ResolvedById { get; internal set; }
    public string? AdminNotes { get; internal set; }
    public string? Evidence { get; internal set; }
}

public class GetDisputesListQueryHandler : IRequestHandler<GetDisputesListQuery, PaginatedList<DisputeDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetDisputesListQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<DisputeDto>> Handle(GetDisputesListQuery request, CancellationToken cancellationToken)
    {
        // Only admins can see all disputes
        if (!_currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only administrators can view all disputes");
        
        var query = _context.Disputes
            .Include(d => d.Order)
            .Include(d => d.RaisedBy)
            .AsQueryable();
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<DisputeStatus>(request.Status, true, out var status))
        {
            query = query.Where(d => d.Status == status);
        }
        
        var disputesQuery = query
            .OrderByDescending(d => d.CreatedAt)
            .Select(x => new DisputeDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                RaisedById = x.RaisedById,
                Status = x.Status,
                Reason = x.Reason,
                Description = x.Description,
                Evidence = x.Evidence,
                AdminNotes = x.AdminNotes,
                ResolvedAt = x.ResolvedAt,
                ResolvedById = x.ResolvedById,
                Resolution = x.Resolution.HasValue ? x.Resolution.Value : null,
                CreatedAt = x.CreatedAt,
                CreatedBy = x.CreatedBy
            });
        return PaginatedList<DisputeDto>.Create(disputesQuery, request.PageNumber, request.PageSize);
    }
}