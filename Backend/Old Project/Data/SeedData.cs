using Microsoft.AspNetCore.Identity;
using yaqeenpay.Models;

namespace yaqeenpay.Data
{
    public static class SeedData
    {
        public static async Task Initialize(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager)
        {
            // Seed roles
            string[] roles = { UserRole.Buyer.ToString(), UserRole.Seller.ToString(), UserRole.Admin.ToString() };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                }
            }

            // Seed admin user
            var adminEmail = "admin@yaqeenpay.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = GuidV7Generator.GenerateV7(),
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailVerifiedAt = DateTime.UtcNow,
                    KycStatus = KycStatus.Verified,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123456");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, UserRole.Admin.ToString());
                }
            }
        }
    }
}