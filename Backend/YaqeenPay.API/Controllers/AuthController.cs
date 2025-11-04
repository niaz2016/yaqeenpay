using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.Authentication.Commands.Login;
using YaqeenPay.Application.Features.Authentication.Commands.LoginWithGoogle;
using YaqeenPay.Application.Features.Authentication.Commands.RefreshToken;
using YaqeenPay.Application.Features.Authentication.Commands.Register;
using YaqeenPay.Application.Features.Authentication.Commands.VerifyDevice;
using YaqeenPay.Application.Features.Authentication.Commands.ResendOtp;
using YaqeenPay.Application.Features.Authentication.Commands.VerifyEmail;
using YaqeenPay.Application.Features.Authentication.Commands.VerifyEmailByToken;
using YaqeenPay.Application.Features.Authentication.Commands.ResendVerificationEmail;
using YaqeenPay.Application.Features.Authentication.Commands.ResendVerificationEmailByEmail;
using YaqeenPay.Application.Features.Authentication.Commands.ForgotPassword;
using YaqeenPay.Application.Features.Authentication.Commands.ResetPassword;

namespace YaqeenPay.API.Controllers;

public class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("google")]
    public async Task<IActionResult> LoginWithGoogle(LoginWithGoogleCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("verify-device")]
    public async Task<IActionResult> VerifyDevice(VerifyDeviceCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(RefreshTokenCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("verify-email-by-token")]
    public async Task<IActionResult> VerifyEmailByToken(VerifyEmailByTokenCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail(ResendVerificationEmailCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("resend-verification-email-by-email")]
    public async Task<IActionResult> ResendVerificationEmailByEmail(ResendVerificationEmailByEmailCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordCommand command)
    {
        return Ok(await Mediator.Send(command));
    }
}