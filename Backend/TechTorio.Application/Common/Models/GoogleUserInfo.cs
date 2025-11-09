namespace TechTorio.Application.Common.Models;

public record GoogleUserInfo(
    string Subject,
    string Email,
    string? FirstName,
    string? LastName,
    string? PictureUrl,
    bool EmailVerified
);
