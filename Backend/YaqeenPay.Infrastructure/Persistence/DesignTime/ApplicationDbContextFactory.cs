using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Infrastructure.Persistence;

namespace YaqeenPay.Infrastructure.Persistence.DesignTime
{
    // Design-time factory so `dotnet ef` can instantiate the DbContext without full DI
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            // Try to load configuration from API project if available; otherwise, fallback to env var or default
            var basePath = Directory.GetCurrentDirectory();

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connStr = configuration.GetConnectionString("DefaultConnection")
                          ?? Environment.GetEnvironmentVariable("DefaultConnection")
                          ?? Environment.GetEnvironmentVariable("CONNECTION_STRING")
                          ?? "Host=localhost;Port=5432;Database=yaqeenpay_dev;Username=postgres;Password=postgres";

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseNpgsql(connStr, npgsql =>
            {
                // Ensure migrations are placed in the Infrastructure assembly
                npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
            });

            // Provide a minimal current user service for design-time
            var currentUser = new DesignTimeCurrentUserService();

            return new ApplicationDbContext(optionsBuilder.Options, currentUser);
        }

        private sealed class DesignTimeCurrentUserService : ICurrentUserService
        {
            public Guid UserId => Guid.Empty;
            public string? IpAddress => "127.0.0.1";
            public string? UserAgent => "design-time";

            public bool IsInRole(string role) => false;
        }
    }
}
