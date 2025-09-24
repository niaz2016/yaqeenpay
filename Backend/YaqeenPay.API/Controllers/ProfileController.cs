using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.UserManagement.Commands.UpdateProfile;
using YaqeenPay.Application.Features.UserManagement.Queries.GetUserProfile;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace YaqeenPay.API.Controllers;

[
Authorize]
public class ProfileController : ApiControllerBase
{
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] Application.Features.UserManagement.Commands.ChangePassword.ChangePasswordCommand command)
    {
        var result = await Mediator.Send(command);
        if (result)
            return Ok(new { success = true, message = "Password changed successfully" });
        return BadRequest(new { success = false, message = "Password change failed" });
    }
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

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "No file provided" });

        // Ensure uploads folder exists under wwwroot
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid().ToString()}_blob{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        // Return wrapped ApiResponse { success: true, data: { url } } so frontend ApiService unwraps correctly
        return Ok(new { success = true, data = new { url } });
    }
}