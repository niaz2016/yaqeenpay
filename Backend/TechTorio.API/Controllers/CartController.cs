using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Cart.Commands.AddToCart;
using TechTorio.Application.Features.Cart.Commands.UpdateCartItem;
using TechTorio.Application.Features.Cart.Commands.RemoveFromCart;
using TechTorio.Application.Features.Cart.Commands.ClearCart;
using TechTorio.Application.Features.Cart.Queries.GetCart;

namespace TechTorio.API.Controllers;

[Authorize]
public class CartController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        return Ok(await Mediator.Send(new GetCartQuery()));
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddToCart(AddToCartCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPut("items/{cartItemId}")]
    public async Task<IActionResult> UpdateCartItem(Guid cartItemId, UpdateCartItemCommand command)
    {
        if (cartItemId != command.CartItemId)
        {
            return BadRequest("Cart item ID mismatch.");
        }

        return Ok(await Mediator.Send(command));
    }

    [HttpDelete("items/{cartItemId}")]
    public async Task<IActionResult> RemoveFromCart(Guid cartItemId)
    {
        var command = new RemoveFromCartCommand { CartItemId = cartItemId };
        return Ok(await Mediator.Send(command));
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearCart()
    {
        return Ok(await Mediator.Send(new ClearCartCommand()));
    }
}