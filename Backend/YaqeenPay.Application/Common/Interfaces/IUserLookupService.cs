using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IUserLookupService
{
    Task<ApplicationUser?> GetUserByPhoneNumberAsync(string phoneNumber);
    Task<ApplicationUser?> GetUserByEmailAsync(string email);
    Task<ApplicationUser?> GetUserByIdAsync(Guid userId);
    Task<bool> PhoneNumberExistsAsync(string phoneNumber);
    Task<bool> EmailExistsAsync(string email);
}