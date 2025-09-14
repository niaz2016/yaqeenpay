using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Infrastructure.Persistence;

namespace YaqeenPay.API.Services;

public class DataMigrationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DataMigrationService> _logger;

    public DataMigrationService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ApplicationDbContext context,
        ILogger<DataMigrationService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    public async Task MigrateOldJwtDataAsync()
    {
        try
        {
            _logger.LogInformation("Starting JWT data migration...");

            // Create default roles if they don't exist
            await EnsureRolesCreatedAsync();

            // Create admin user if it doesn't exist
            await EnsureAdminUserCreatedAsync();

            _logger.LogInformation("JWT data migration completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during JWT data migration");
            throw;
        }
    }

    private async Task EnsureRolesCreatedAsync()
    {
        string[] roles = { "Admin", "User", "Seller", "Buyer" };

        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new ApplicationRole 
                { 
                    Name = roleName,
                    CreatedDate = DateTime.UtcNow,
                    Active = true
                });
                _logger.LogInformation("Created role: {RoleName}", roleName);
            }
        }
    }

    private async Task EnsureAdminUserCreatedAsync()
    {
        var adminEmail = "admin@yaqeenpay.com";
        var admin = await _userManager.FindByEmailAsync(adminEmail);

        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = "admin",
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(admin, "Admin@123456");

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(admin, "Admin");
                _logger.LogInformation("Created admin user with email: {Email}", adminEmail);
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Failed to create admin user: {Errors}", errors);
            }
        }
    }
}