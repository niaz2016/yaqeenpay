using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.Orders.Commands.CompleteOrder;
using YaqeenPay.Application.Features.Orders.Commands.CreateOrder;
using YaqeenPay.Application.Features.Orders.Commands.UpdateShippingDetails;
using YaqeenPay.Application.Features.Orders.Commands.MarkOrderAsShipped;
using YaqeenPay.Application.Features.Orders.Commands.MarkOrderAsDelivered;
using YaqeenPay.Application.Features.Orders.Commands.RejectOrder;
using YaqeenPay.Application.Features.Orders.Commands.CancelOrder;
using YaqeenPay.Application.Features.Orders.Commands.CreateDispute;
using YaqeenPay.Application.Features.Orders.Queries.GetOrderById;
using YaqeenPay.Application.Features.Orders.Queries.GetOrdersList;
using YaqeenPay.Application.Features.Orders.Queries.GetBuyerOrders;
using YaqeenPay.Application.Features.Orders.Queries.GetSellerOrders;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class OrdersController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetOrdersListQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("buyer")]
    public async Task<IActionResult> GetBuyerOrders([FromQuery] GetBuyerOrdersQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("seller")]
    public async Task<IActionResult> GetSellerOrders([FromQuery] GetSellerOrdersQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await Mediator.Send(new GetOrderByIdQuery { OrderId = id }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPut("{id}/shipping")]
    public async Task<IActionResult> UpdateShippingDetails(Guid id, UpdateShippingDetailsCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/ship")]
    public async Task<IActionResult> MarkAsShipped(Guid id, MarkOrderAsShippedCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/deliver")]
    public async Task<IActionResult> MarkAsDelivered(Guid id, MarkOrderAsDeliveredCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(Guid id)
    {
        return Ok(await Mediator.Send(new CompleteOrderCommand { OrderId = id }));
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, RejectOrderCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        return Ok(await Mediator.Send(new CancelOrderCommand { OrderId = id }));
    }

    [HttpPost("{id}/dispute")]
    public async Task<IActionResult> CreateDispute(Guid id, CreateDisputeCommand command)
    {
        command.OrderId = id;
        return Ok(await Mediator.Send(command));
    }
}