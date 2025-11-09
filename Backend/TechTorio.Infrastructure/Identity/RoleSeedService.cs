using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using TechTorio.Domain.Entities.Identity;
using UserRoleEnum = TechTorio.Domain.Enums.UserRole;

namespace TechTorio.Infrastructure.Identity;

public class RoleSeedService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ILogger<RoleSeedService> _logger;

    public RoleSeedService(
        RoleManager<ApplicationRole> roleManager,
        ILogger<RoleSeedService> logger)
    {
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task SeedRolesAsync()
    {
        var roles = Enum.GetValues<UserRoleEnum>();

        foreach (var role in roles)
        {
            var roleName = role.ToString();
            
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var applicationRole = new ApplicationRole(roleName);

                var result = await _roleManager.CreateAsync(applicationRole);
                
                if (result.Succeeded)
                {
                    _logger.LogInformation("Role '{RoleName}' created successfully", roleName);
                }
                else
                {
                    _logger.LogError("Failed to create role '{RoleName}': {Errors}", 
                        roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                _logger.LogInformation("Role '{RoleName}' already exists", roleName);
            }
        }
    }
}