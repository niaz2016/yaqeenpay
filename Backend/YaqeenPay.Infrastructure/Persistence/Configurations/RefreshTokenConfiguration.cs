using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities.Identity;
namespace YaqeenPay.Infrastructure.Persistence.Configurations;
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(t => t.Id);
        
        // RefreshToken has its own Created property
        builder.Property(t => t.Created)
            .HasColumnName("Created");
        builder.Property(t => t.Token)
            .IsRequired()
            .HasMaxLength(128);
        builder.Property(t => t.TokenHash)
            .IsRequired()
            .HasMaxLength(128);
        // Configure relationship with ApplicationUser
        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
