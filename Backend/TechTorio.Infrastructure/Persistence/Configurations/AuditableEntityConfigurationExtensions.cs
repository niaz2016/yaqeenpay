using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Common;

namespace TechTorio.Infrastructure.Persistence.Configurations;

public static class AuditableEntityConfigurationExtensions
{
    public static void ConfigureAuditableProperties<T>(this EntityTypeBuilder<T> builder) where T : AuditableEntity
    {
        // Map the CreatedAt property to the Created column in the database
        builder.Property(e => e.CreatedAt)
            .HasColumnName("Created");
            
        // Similarly map other auditable fields if needed
        builder.Property(e => e.LastModifiedAt)
            .HasColumnName("Modified");
    }
}