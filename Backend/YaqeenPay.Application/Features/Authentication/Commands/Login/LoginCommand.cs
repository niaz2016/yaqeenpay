using FluentValidation;
using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities.Identity;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace YaqeenPay.Application.Features.Authentication.Commands.Login;

public record LoginCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not valid.");
        
        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public record AuthenticationResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime TokenExpires { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
}

public class LoginCommandHandler(
    IApplicationDbContext context,
    IIdentityService identityService,
    IJwtService jwtService,
    ICurrentUserService currentUserService) : IRequestHandler<LoginCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IApplicationDbContext _context = context;
    private readonly IIdentityService _identityService = identityService;
    private readonly IJwtService _jwtService = jwtService;
    private readonly ICurrentUserService _currentUserService = currentUserService;

    public async Task<ApiResponse<AuthenticationResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var authResult = await _identityService.AuthenticateAsync(request.Email, request.Password);
        var result = authResult.Item1;
        var user = authResult.Item2;

        // Get the user attempting to login (even if authentication failed)
        var attemptingUser = user ?? await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        // Create notification only for the user involved in the login attempt
        if (!result.Succeeded)
        {
            // Only notify the user who attempted to login (if user exists)
            if (attemptingUser != null)
            {
                var failedLoginNotification = new YaqeenPay.Domain.Entities.Notification
                {
                    UserId = attemptingUser.Id,
                    Type = YaqeenPay.Domain.Enums.NotificationType.Security,
                    Title = "Failed login attempt",
                    Message = $"Failed login attempt detected on your account from IP: {_currentUserService.IpAddress ?? "Unknown"}",
                    Priority = YaqeenPay.Domain.Enums.NotificationPriority.High,
                    Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty,
                    IsActive = true
                };

                _context.Notifications.Add(failedLoginNotification);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }

        // Generate JWT token with roles
        var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
        if (user == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }

        var roles = await _identityService.GetUserRolesAsync(user.Id);
        var (jwtToken, refreshToken) = _jwtService.GenerateTokens(user, roles, ipAddress);

        // Create success notification only for the user who logged in
        var successLoginNotification = new YaqeenPay.Domain.Entities.Notification
        {
            UserId = user.Id,
            Type = YaqeenPay.Domain.Enums.NotificationType.System,
            Title = "Successful login",
            Message = $"You have successfully logged in from IP: {ipAddress}",
            Priority = YaqeenPay.Domain.Enums.NotificationPriority.Low,
            Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = user.Id,
            IsActive = true
        };

        _context.Notifications.Add(successLoginNotification);

        // Save the refresh token
        user.RefreshTokens.Add(refreshToken);
        // Remove old refresh tokens
        RemoveOldRefreshTokens(user);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
        {
            Token = jwtToken,
            // Return the raw refresh token to the client; we store only the hash server-side
            RefreshToken = refreshToken.Token,
            TokenExpires = refreshToken.ExpiresAt,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        });
    }

    private void RemoveOldRefreshTokens(ApplicationUser user)
    {
        // Remove old inactive refresh tokens from user based on TTL
        user.RefreshTokens.RemoveAll(x => 
            !x.IsActive && 
            DateTime.UtcNow.AddDays(-7) >= x.ExpiresAt);
    }
}
