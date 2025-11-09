using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Categories.Queries.GetCategories;

namespace TechTorio.API.Controllers;

public class CategoriesController : ApiControllerBase
{
    /// <summary>
    /// Get all categories - publicly accessible for browsing
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories([FromQuery] GetCategoriesQuery query)
    {
        return Ok(await Mediator.Send(query));
    }
}