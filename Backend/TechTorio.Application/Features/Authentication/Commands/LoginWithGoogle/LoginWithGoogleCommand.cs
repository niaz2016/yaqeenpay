using System;
using System.Linq;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Application.Features.Authentication.Commands.Login;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Features.Authentication.Commands.LoginWithGoogle;

public record LoginWithGoogleCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public string IdToken { get; init; } = string.Empty;
}

public class LoginWithGoogleCommandValidator : AbstractValidator<LoginWithGoogleCommand>
{
    public LoginWithGoogleCommandValidator()
    {
        RuleFor(v => v.IdToken)
            .NotEmpty().WithMessage("Google ID token is required.");
    }
}

public class LoginWithGoogleCommandHandler : IRequestHandler<LoginWithGoogleCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IGoogleAuthService _googleAuthService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDeviceService _deviceService;
    private readonly GoogleAuthSettings _googleSettings;
    private readonly IApplicationDbContext _context;

    public LoginWithGoogleCommandHandler(
        IGoogleAuthService googleAuthService,
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        ICurrentUserService currentUserService,
        IDeviceService deviceService,
        IApplicationDbContext context,
        IOptions<GoogleAuthSettings> googleOptions)
    {
        _googleAuthService = googleAuthService;
        _userManager = userManager;
        _jwtService = jwtService;
        _currentUserService = currentUserService;
        _deviceService = deviceService;
        _context = context;
        _googleSettings = googleOptions.Value;
    }

    public async Task<ApiResponse<AuthenticationResponse>> Handle(LoginWithGoogleCommand request, CancellationToken cancellationToken)
    {
        if (_googleSettings.RequireChrome && !IsChrome(_currentUserService.UserAgent))
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Google sign-in is only available in Google Chrome.");
        }

        var googleUser = await _googleAuthService.ValidateIdTokenAsync(request.IdToken, cancellationToken);
        if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Unable to verify Google sign-in.");
        }

    var user = await _userManager.FindByEmailAsync(googleUser.Email);
    var isNewUser = false;
    string? roleWarning = null;

        if (user == null)
        {
            user = new ApplicationUser
            {
                Email = googleUser.Email,
                UserName = googleUser.Email,
                EmailConfirmed = true,
                EmailVerifiedAt = DateTime.UtcNow,
                FirstName = googleUser.FirstName,
                LastName = googleUser.LastName,
                ProfileImageUrl = googleUser.PictureUrl,
                Created = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("Failed to create user from Google sign-in.", createResult.Errors.Select(e => e.Description).ToList());
            }

            // Ensure the new user has the default Buyer role
            var roleResult = await _userManager.AddToRoleAsync(user, "Buyer");
            if (!roleResult.Succeeded)
            {
                roleWarning = string.Join(", ", roleResult.Errors.Select(e => e.Description));
            }

            isNewUser = true;
        }
        else
        {
            var updated = false;
            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                user.EmailVerifiedAt = user.EmailVerifiedAt ?? DateTime.UtcNow;
                updated = true;
            }

            if (string.IsNullOrWhiteSpace(user.FirstName) && !string.IsNullOrWhiteSpace(googleUser.FirstName))
            {
                user.FirstName = googleUser.FirstName;
                updated = true;
            }

            if (string.IsNullOrWhiteSpace(user.LastName) && !string.IsNullOrWhiteSpace(googleUser.LastName))
            {
                user.LastName = googleUser.LastName;
                updated = true;
            }

            if (string.IsNullOrWhiteSpace(user.ProfileImageUrl) && !string.IsNullOrWhiteSpace(googleUser.PictureUrl))
            {
                user.ProfileImageUrl = googleUser.PictureUrl;
                updated = true;
            }

            if (updated)
            {
                await _userManager.UpdateAsync(user);
            }
        }

        // Link the Google login to this account if not already linked
        var existingLogin = await _userManager.FindByLoginAsync("Google", googleUser.Subject);
        if (existingLogin == null)
        {
            var addLoginResult = await _userManager.AddLoginAsync(user, new UserLoginInfo("Google", googleUser.Subject, "Google"));
            if (!addLoginResult.Succeeded)
            {
                // If the login is already linked to this user, ignore; otherwise fail
                var errorDescriptions = addLoginResult.Errors.Select(e => e.Description).ToList();
                var alreadyLinkedToSameUser = errorDescriptions.Any(e => e.Contains("already associated", StringComparison.OrdinalIgnoreCase));
                if (!alreadyLinkedToSameUser)
                {
                    return ApiResponse<AuthenticationResponse>.FailureResponse("Failed to link Google account.", errorDescriptions);
                }
            }
        }

        // Ensure the user has at least the Buyer role
        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any())
        {
            var ensureRoleResult = await _userManager.AddToRoleAsync(user, "Buyer");
            if (!ensureRoleResult.Succeeded)
            {
                var warning = string.Join(", ", ensureRoleResult.Errors.Select(e => e.Description));
                roleWarning = string.IsNullOrEmpty(roleWarning) ? warning : string.Join("; ", roleWarning, warning);
            }

            roles = await _userManager.GetRolesAsync(user);
        }

        // Register the current device as trusted without OTP
    var userAgent = _currentUserService.UserAgent ?? "Unknown";
    var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
        var fingerprint = _deviceService.GenerateDeviceFingerprint(userAgent);
        var existingDevice = await _deviceService.GetUserDeviceAsync(user.Id, fingerprint, cancellationToken);
        var isNewDevice = existingDevice == null;

        if (existingDevice == null)
        {
            var device = await _deviceService.RegisterDeviceAsync(user.Id, userAgent, ipAddress, cancellationToken);
            await _deviceService.VerifyDeviceAsync(device.Id, cancellationToken);
        }
        else
        {
            await _deviceService.UpdateDeviceLastSeenAsync(existingDevice.Id, cancellationToken);
            if (!existingDevice.IsVerified)
            {
                await _deviceService.VerifyDeviceAsync(existingDevice.Id, cancellationToken);
            }
        }

        var (jwtToken, refreshToken) = _jwtService.GenerateTokens(user, roles, ipAddress);
        user.RefreshTokens.Add(refreshToken);
        RemoveOldRefreshTokens(user);
        await _context.SaveChangesAsync(cancellationToken);

        var message = isNewUser ? "Google account linked and new profile created." : "Google sign-in successful.";
        if (!string.IsNullOrEmpty(roleWarning))
        {
            message = string.Concat(message, " Role assignment warning: ", roleWarning, ".");
        }

        return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
        {
            Token = jwtToken,
            RefreshToken = refreshToken.Token,
            TokenExpires = refreshToken.ExpiresAt,
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            UserName = user.UserName ?? string.Empty,
            RequiresDeviceVerification = false,
            IsNewUser = isNewUser,
            IsNewDevice = isNewDevice
        }, message);
    }

    private static bool IsChrome(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return false;
        }

        var ua = userAgent.ToLowerInvariant();
        var isChrome = ua.Contains("chrome") || ua.Contains("crios") || ua.Contains("chromium");
        if (!isChrome)
        {
            return false;
        }

        if (ua.Contains("edg/") || ua.Contains("edge"))
        {
            return false;
        }

        if (ua.Contains("opr/") || ua.Contains("opera"))
        {
            return false;
        }

        return true;
    }

    private static void RemoveOldRefreshTokens(ApplicationUser user)
    {
        user.RefreshTokens.RemoveAll(x => !x.IsActive && DateTime.UtcNow.AddDays(-7) >= x.ExpiresAt);
    }
}
