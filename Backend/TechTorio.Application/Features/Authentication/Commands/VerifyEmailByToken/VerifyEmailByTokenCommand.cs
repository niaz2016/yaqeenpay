using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Authentication.Commands.VerifyEmailByToken;

public record VerifyEmailByTokenCommand : IRequest<ApiResponse<bool>>
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
}

public class VerifyEmailByTokenCommandHandler : IRequestHandler<VerifyEmailByTokenCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IIdentityService _identityService;

    public VerifyEmailByTokenCommandHandler(
        IApplicationDbContext context,
        IIdentityService identityService)
    {
        _context = context;
        _identityService = identityService;
    }

    public async Task<ApiResponse<bool>> Handle(VerifyEmailByTokenCommand request, CancellationToken cancellationToken)
    {
        // Find the verification notification for this user
        var verificationNotification = await _context.Notifications
            .Where(n => n.UserId == request.UserId && 
                       n.Metadata != null && 
                       n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                       n.IsActive)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (verificationNotification == null)
        {
            return ApiResponse<bool>.FailureResponse(
                "Verification link not found or has expired. Please request a new verification email.");
        }

        // Parse metadata to get token and expiry
        try
        {
            if (string.IsNullOrEmpty(verificationNotification.Metadata))
            {
                return ApiResponse<bool>.FailureResponse("Invalid verification data.");
            }

            var metadata = System.Text.Json.JsonDocument.Parse(verificationNotification.Metadata);
            var storedToken = metadata.RootElement.GetProperty("token").GetString();
            var expiryStr = metadata.RootElement.GetProperty("expiry").GetString();
            var expiry = DateTime.Parse(expiryStr!);

            // Check if expired
            if (DateTime.UtcNow > expiry)
            {
                verificationNotification.IsActive = false;
                await _context.SaveChangesAsync(cancellationToken);
                
                return ApiResponse<bool>.FailureResponse(
                    "Verification link has expired. Please request a new verification email.");
            }

            // Verify token
            if (storedToken != request.Token)
            {
                return ApiResponse<bool>.FailureResponse(
                    "Invalid verification link. Please check your email and try again.");
            }

            // Token is valid - mark email as verified
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                return ApiResponse<bool>.FailureResponse("User not found.");
            }

            if (user.EmailConfirmed)
            {
                return ApiResponse<bool>.SuccessResponse(true, "Email is already verified.");
            }

            // Mark email as confirmed using IdentityService
            var confirmResult = await _identityService.ConfirmEmailAsync(request.UserId);
            
            if (!confirmResult.Succeeded)
            {
                return ApiResponse<bool>.FailureResponse(
                    $"Failed to confirm email: {string.Join(", ", confirmResult.Errors)}");
            }
            
            // Deactivate the notification
            verificationNotification.IsActive = false;
            verificationNotification.Status = TechTorio.Domain.Enums.NotificationStatus.Read;

            await _context.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResponse(true, "Email verified successfully! You can now log in.");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.FailureResponse($"Verification failed: {ex.Message}");
        }
    }
}
