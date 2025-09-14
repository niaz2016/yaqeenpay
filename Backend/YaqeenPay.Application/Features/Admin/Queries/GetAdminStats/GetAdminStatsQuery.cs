using MediatR;

namespace YaqeenPay.Application.Features.Admin.Queries.GetAdminStats;

public record GetAdminStatsQuery : IRequest<AdminStatsResponse>;