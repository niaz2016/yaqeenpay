using FluentValidation;
using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities.Identity;
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
        if (!result.Succeeded)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }
        // Generate JWT token
        var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
        var (jwtToken, refreshToken) = _jwtService.GenerateTokens(user, ipAddress);
        // Save the refresh token
        user.RefreshTokens.Add(refreshToken);
        // Remove old refresh tokens
        RemoveOldRefreshTokens(user);
        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
        {
            Token = jwtToken,
            RefreshToken = refreshToken.TokenHash,
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
