using MediatR;
using System;
using System.Collections.Generic;

namespace TechTorio.Application.Features.Admin.Queries.GetOrders;

public class GetOrdersQuery : IRequest<List<AdminOrderDto>>
{
}

public class AdminOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string BuyerEmail { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string KycStatus { get; set; } = string.Empty;
    public string UserStatus { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
