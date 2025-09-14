using Microsoft.AspNetCore.Identity;

namespace YaqeenPay.Domain.Entities.Identity;

public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() : base()
    {
        CreatedDate = DateTime.UtcNow;
        Active = true;
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
        CreatedDate = DateTime.UtcNow;
        Active = true;
    }

    public DateTime CreatedDate { get; set; }
    public bool Active { get; set; }
}