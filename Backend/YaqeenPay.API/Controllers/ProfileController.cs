using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.UserManagement.Commands.UpdateProfile;
using YaqeenPay.Application.Features.UserManagement.Queries.GetUserProfile;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class ProfileController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUserProfile()
    {
        return Ok(await Mediator.Send(new GetUserProfileQuery()));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile(UpdateProfileCommand command)
    {
        return Ok(await Mediator.Send(command));
    }
}