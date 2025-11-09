using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.API.Controllers;
using TechTorio.Application.Features.UserManagement.Commands.CreateBusinessProfile;
using TechTorio.Application.Features.UserManagement.Queries.GetBusinessProfile;

namespace TechTorio.API.Controllers;

[Authorize]
public class BusinessProfileController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetBusinessProfile()
    {
        return Ok(await Mediator.Send(new GetBusinessProfileQuery()));
    }

    [HttpPost]
    public async Task<IActionResult> CreateBusinessProfile(CreateBusinessProfileCommand command)
    {
        return Ok(await Mediator.Send(command));
    }
}