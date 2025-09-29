using FluentValidation;
using MediatR;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.Authentication.Commands.Login;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Entities.Identity;
namespace YaqeenPay.Application.Features.Authentication.Commands.RefreshToken;
public record RefreshTokenCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public string RefreshToken { get; set; } = string.Empty;
}
public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(v => v.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdentityService _identityService;
    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        ICurrentUserService currentUserService,
        IIdentityService identityService)
    {
        _context = context;
        _jwtService = jwtService;
        _currentUserService = currentUserService;
        _identityService = identityService;
    }
    public async Task<ApiResponse<AuthenticationResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Compute hash of the provided raw refresh token and match by hash
        var providedHash = _jwtService.ComputeRefreshTokenHash(request.RefreshToken);
        var refreshToken = _context.RefreshTokens
            .FirstOrDefault(rt => rt.TokenHash == providedHash);
        if (refreshToken == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid refresh token");
        }
        var user = _context.Users
            .FirstOrDefault(u => u.Id == refreshToken.UserId);
        if (user == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid refresh token");
        }
        if (!refreshToken.IsActive)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Inactive refresh token");
        }
        // Replace old refresh token with a new one
        var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
    var roles = await _identityService.GetUserRolesAsync(user.Id);
        var (jwtToken, newRefreshToken) = _jwtService.GenerateTokens(user, roles, ipAddress);
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.ReplacedById = newRefreshToken.Id;
        user.RefreshTokens.Add(newRefreshToken);
        // Remove old refresh tokens
        user.RefreshTokens.RemoveAll(rt =>
            !rt.IsActive &&
            DateTime.UtcNow.AddDays(-7) >= rt.ExpiresAt);
        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
        {
            Token = jwtToken,
            // Return raw token to client
            RefreshToken = newRefreshToken.Token,
            TokenExpires = newRefreshToken.ExpiresAt,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        });
    }
}
