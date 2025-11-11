using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Wishlist.Commands.AddToWishlist;
using TechTorio.Application.Features.Wishlist.Commands.RemoveFromWishlist;
using TechTorio.Application.Features.Wishlist.Commands.ClearWishlist;
using TechTorio.Application.Features.Wishlist.Queries.GetWishlist;

namespace TechTorio.API.Controllers;

[Authorize]
public class WishlistController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWishlist()
    {
        return Ok(await Mediator.Send(new GetWishlistQuery()));
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddToWishlist(AddToWishlistCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpDelete("items/{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId)
    {
        var command = new RemoveFromWishlistCommand { ProductId = productId };
        return Ok(await Mediator.Send(command));
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearWishlist()
    {
        return Ok(await Mediator.Send(new ClearWishlistCommand()));
    }
}
