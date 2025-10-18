using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.Products.Commands.CreateProduct;
using YaqeenPay.Application.Features.Products.Commands.UpdateProduct;
using YaqeenPay.Application.Features.Products.Commands.DeleteProduct;
using YaqeenPay.Application.Features.Products.Queries.GetSellerProducts;
using YaqeenPay.Application.Features.Products.Queries.GetProducts;
using YaqeenPay.Application.Features.Products.Queries.GetProductById;
using YaqeenPay.Application.Features.Categories.Queries.GetCategories;

namespace YaqeenPay.API.Controllers;

public class ProductsController : ApiControllerBase
{
    /// <summary>
    /// Get products for marketplace browsing - publicly accessible
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts([FromQuery] GetProductsQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    /// <summary>
    /// Get seller's products - requires seller authentication
    /// </summary>
    [HttpGet("seller")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> GetSellerProducts([FromQuery] GetSellerProductsQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    /// <summary>
    /// Get product by ID - accessible to product owner or for active products
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        var query = new GetProductByIdQuery { Id = id };
        return Ok(await Mediator.Send(query));
    }

    /// <summary>
    /// Create new product - requires seller authentication
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> CreateProduct(CreateProductCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    /// <summary>
    /// Update existing product - requires seller authentication
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> UpdateProduct(Guid id, UpdateProductCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest("Product ID mismatch.");
        }

        return Ok(await Mediator.Send(command));
    }

    /// <summary>
    /// Delete product - requires seller authentication
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var command = new DeleteProductCommand { Id = id };
        return Ok(await Mediator.Send(command));
    }
}