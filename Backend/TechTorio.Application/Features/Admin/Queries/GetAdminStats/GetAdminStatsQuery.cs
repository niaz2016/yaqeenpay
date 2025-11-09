using MediatR;

namespace TechTorio.Application.Features.Admin.Queries.GetAdminStats;

public record GetAdminStatsQuery : IRequest<AdminStatsResponse>;