using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;
namespace TechTorio.Infrastructure.Persistence.Configurations;
public class LedgerConfiguration : IEntityTypeConfiguration<LedgerAccount>
{
    public void Configure(EntityTypeBuilder<LedgerAccount> builder)
    {
        builder.HasKey(l => l.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();
        builder.Property(l => l.Currency)
            .HasMaxLength(3);
        builder.Property(l => l.Type)
            .IsRequired();
        // Set default values
        builder.Property(l => l.Currency)
            .HasDefaultValue("PKR");
    }
}
public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.HasKey(l => l.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();
        builder.Property(l => l.Description)
            .HasMaxLength(500);
        // Configure value object
        builder.OwnsOne(l => l.Amount, a =>
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
        builder.HasOne<LedgerAccount>()
            .WithMany()
            .HasForeignKey(l => l.CreditAccountId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<LedgerAccount>()
            .WithMany()
            .HasForeignKey(l => l.DebitAccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
