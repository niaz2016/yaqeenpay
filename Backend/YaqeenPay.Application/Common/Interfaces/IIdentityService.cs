using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Entities.Identity;
namespace YaqeenPay.Application.Common.Interfaces;
public interface IIdentityService
{
    Task<string> GetUserNameAsync(Guid userId);
    Task<bool> IsInRoleAsync(Guid userId, string role);
    Task<bool> AuthorizeAsync(Guid userId, string policyName);
    Task<(Result Result, Guid UserId)> CreateUserAsync(string userName, string email, string password);
    Task<Result> AddUserToRoleAsync(Guid userId, string role);
    Task<Result> DeleteUserAsync(Guid userId);
    Task<(Result Result, ApplicationUser? User)> AuthenticateAsync(string email, string password);
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
