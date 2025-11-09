using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.ValueObjects;
namespace TechTorio.Infrastructure.Persistence.Configurations;
public class WithdrawalConfiguration : IEntityTypeConfiguration<Withdrawal>
{
    public void Configure(EntityTypeBuilder<Withdrawal> builder)
    {
        builder.HasKey(w => w.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();
        // Configure value object
        builder.OwnsOne(w => w.Amount, a =>
        {
            a.Property(m => m.Amount)
                .HasColumnName("Amount")
                .IsRequired();
            a.Property(m => m.Currency)
                .HasColumnName("Currency")
                .HasMaxLength(3)
                .IsRequired();
        });
        // Configure relationships
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(w => w.SellerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(w => w.Channel)
            .IsRequired();
        
        builder.Property(w => w.Reference)
            .HasMaxLength(50)
            .IsRequired();
            
        builder.Property(w => w.ChannelReference)
            .HasMaxLength(100);
            
        builder.Property(w => w.Status)
            .IsRequired();
    }
}
