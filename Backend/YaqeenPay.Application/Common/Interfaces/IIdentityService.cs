using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Entities.Identity;
namespace YaqeenPay.Application.Common.Interfaces;
public interface IIdentityService
{
    Task<string> GetUserNameAsync(Guid userId);
    Task<bool> IsInRoleAsync(Guid userId, string role);
    Task<bool> AuthorizeAsync(Guid userId, string policyName);
    // Create user and persist basic profile fields when provided
    Task<(Result Result, Guid UserId)> CreateUserAsync(
        string userName,
        string email,
        string password,
        string? firstName = null,
        string? lastName = null,
        string? phoneNumber = null);
    Task<Result> AddUserToRoleAsync(Guid userId, string role);
    Task<Result> DeleteUserAsync(Guid userId);
    Task<(Result Result, ApplicationUser? User)> AuthenticateAsync(string email, string password);
    Task<IdentityResult> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
    Task<IdentityResult> SetPasswordAsync(Guid userId, string newPassword);
    Task<IList<string>> GetUserRolesAsync(Guid userId);
    Task<string> GenerateEmailVerificationTokenAsync(Guid userId);
    Task<Result> VerifyEmailTokenAsync(Guid userId, string token);
    Task<Result> ConfirmEmailAsync(Guid userId);
}
public class Result
{
    internal Result(bool succeeded, IEnumerable<string> errors)
    {
        Succeeded = succeeded;
        Errors = errors.ToArray();
    }
    public bool Succeeded { get; set; }
    public string[] Errors { get; set; }
    public static Result Success()
    {
        return new Result(true, Array.Empty<string>());
    }
    public static Result Failure(IEnumerable<string> errors)
    {
        return new Result(false, errors);
    }
}
