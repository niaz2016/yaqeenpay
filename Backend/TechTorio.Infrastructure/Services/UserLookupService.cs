using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Infrastructure.Services;

public class UserLookupService : IUserLookupService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserLookupService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ApplicationUser?> GetUserByPhoneNumberAsync(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return null;

        return await _userManager.Users
            .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
    }

    public async Task<ApplicationUser?> GetUserByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        return await _userManager.FindByEmailAsync(email);
    }

    public async Task<ApplicationUser?> GetUserByIdAsync(Guid userId)
    {
        return await _userManager.FindByIdAsync(userId.ToString());
    }

    public async Task<bool> PhoneNumberExistsAsync(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        return await _userManager.Users
            .AnyAsync(u => u.PhoneNumber == phoneNumber);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        var user = await _userManager.FindByEmailAsync(email);
        return user != null;
    }
}