using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        // Configure the CreatedDate property
        builder.Property(r => r.CreatedDate)
               .IsRequired()
               .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
               
        // Configure the Active property
        builder.Property(r => r.Active)
               .IsRequired()
               .HasDefaultValue(true);
    }
}