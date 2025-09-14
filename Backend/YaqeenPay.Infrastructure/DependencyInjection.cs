using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Infrastructure.Identity;
using YaqeenPay.Infrastructure.Persistence;
using YaqeenPay.Infrastructure.Persistence.Repositories;
using YaqeenPay.Infrastructure.Services;

namespace YaqeenPay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Add DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Register interfaces
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Register services
        services.AddScoped<IDocumentStorageService, LocalDocumentStorageService>();
        services.AddScoped<RoleSeedService>();

        // Identity services
        services.AddIdentity<ApplicationUser, ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Configure Identity options
        services.Configure<IdentityOptions>(options =>
        {
            // Password settings
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 6;
            options.Password.RequiredUniqueChars = 1;

            // User settings
            options.User.RequireUniqueEmail = true;
        });

        // JWT Authentication
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secret = jwtSettings["Secret"];

        // Ensure key is at least 32 bytes (256 bits)
        byte[] keyBytes = Encoding.UTF8.GetBytes(secret ?? "ThisIsAVeryLongSecretKeyThatIsAtLeast32BytesLongForHS256Algorithm");
        if (keyBytes.Length < 32)
        {
            // Extend the key using SHA256
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Set to true in production
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                NameClaimType = ClaimTypes.NameIdentifier
            };

            // Diagnostic events to help trace 401 issues in development
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var authHeader = context.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(authHeader))
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("JwtAuth");
                        logger.LogInformation("Authorization header received: {Header}", authHeader.Length > 30 ? authHeader.Substring(0, 30) + "..." : authHeader);
                    }
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("JwtAuth");
                    logger.LogError(context.Exception, "JWT authentication failed: {Message}", context.Exception.Message);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("JwtAuth");
                    var sub = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? context.Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                    logger.LogInformation("JWT validated for user: {UserId}", sub);
                    return Task.CompletedTask;
                }
            };
        });

        // Register services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<YaqeenPay.Application.Common.Interfaces.IIdentityService, IdentityService>();
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IWalletService, WalletService>();
        
        // Register repositories
        services.AddScoped<IWalletRepository, Persistence.Repositories.WalletRepository>();
        services.AddScoped<IWalletTransactionRepository, Persistence.Repositories.WalletTransactionRepository>();
        services.AddScoped<ITopUpRepository, Persistence.Repositories.TopUpRepository>();

        return services;
    }
}