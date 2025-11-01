using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Infrastructure.Identity;
using YaqeenPay.Infrastructure.Persistence;
using YaqeenPay.Infrastructure.Persistence.Repositories;
using YaqeenPay.Infrastructure.Services;
using StackExchange.Redis;
using System.Security.Cryptography;
using YaqeenPay.Infrastructure.Services.Security;

namespace YaqeenPay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Payment Gateway Services Configuration
        services.Configure<GoogleAuthSettings>(configuration.GetSection("GoogleAuth"));
        services.Configure<Services.Easypaisa.EasypaisaSettings>(configuration.GetSection("Easypaisa"));
        // TODO: Re-enable Jazz Cash configuration when namespace issues are resolved
        // services.Configure<Services.JazzCash.JazzCashSettings>(configuration.GetSection("JazzCash"));
        
        // HTTP Clients for Payment Services
        services.AddHttpClient<Services.Easypaisa.EasypaisaPaymentService>();
        // TODO: Re-enable Jazz Cash HTTP client when namespace issues are resolved
        // services.AddHttpClient<Services.JazzCash.JazzCashPaymentService>();
        
        // Register individual payment services
        services.AddScoped<Services.Easypaisa.EasypaisaPaymentService>();
        // TODO: Re-enable Jazz Cash service when namespace issues are resolved
        // services.AddScoped<Services.JazzCash.JazzCashPaymentService>();
        
        // Register payment gateway factory (commented out temporarily)
        // services.AddScoped<IPaymentGatewayFactory, PaymentGatewayFactory>();
        
        // Register default payment service (keeping backward compatibility)
        services.AddScoped<Application.Interfaces.IPaymentGatewayService, Services.Easypaisa.EasypaisaPaymentService>();
        
        // Add DbContext with performance optimizations
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                    npgsqlOptions.CommandTimeout(30); // 30 second timeout
                    // Note: EnableRetryOnFailure removed - incompatible with manual transaction control
                    // Manual transactions are used in WalletService and OrderService for atomicity
                })
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking) // Default to no tracking for reads
                .EnableSensitiveDataLogging(false) // Disable in production
                .EnableDetailedErrors(false); // Disable in production
        });

        // Register interfaces
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Register services
        services.AddScoped<IDocumentStorageService, LocalDocumentStorageService>();
        services.AddScoped<ISmsRateLimitService, SmsRateLimitService>();
        services.AddScoped<IApiRateLimitService, ApiRateLimitService>();
        services.AddHttpClient<ICaptchaService, GoogleRecaptchaService>();
        services.AddScoped<RoleSeedService>();
        services.AddScoped<CategorySeedService>();
        services.AddScoped<Application.Interfaces.IFileUploadService, FileUploadService>();
        services.AddScoped<Application.Interfaces.IAdminConfigurationService, Services.AdminConfigurationService>();
        services.AddScoped<IDeviceService, DeviceService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();

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

        // JWT Authentication (RSA)
        var jwtSettings = configuration.GetSection("JwtSettings");
        var environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

        static bool TryGetDerBytes(string? maybeBase64OrPem, out byte[] der)
        {
            der = Array.Empty<byte>();
            if (string.IsNullOrWhiteSpace(maybeBase64OrPem)) return false;
            if (maybeBase64OrPem.Contains("REPLACE_WITH_", StringComparison.OrdinalIgnoreCase)) return false;

            string trimmed = maybeBase64OrPem.Trim();
            try
            {
                if (trimmed.Contains("BEGIN PUBLIC KEY") || trimmed.Contains("BEGIN PRIVATE KEY") || trimmed.Contains("BEGIN RSA"))
                {
                    // PEM: strip header/footer and whitespace
                    var lines = trimmed.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                                       .Where(l => !l.StartsWith("---"))
                                       .ToArray();
                    var base64 = string.Concat(lines);
                    der = Convert.FromBase64String(base64);
                    return true;
                }
                // Assume Base64 DER
                der = Convert.FromBase64String(trimmed);
                return true;
            }
            catch
            {
                return false;
            }
        }

        byte[]? publicKeyDer = null;
        byte[]? privateKeyDer = null;
        var keyId = jwtSettings["KeyId"];

        // Try to read configured keys (Base64 or PEM)
        TryGetDerBytes(jwtSettings["PublicKey"], out var pkDer1);
        if (pkDer1?.Length > 0) publicKeyDer = pkDer1;
        TryGetDerBytes(jwtSettings["PrivateKey"], out var skDer1);
        if (skDer1?.Length > 0) privateKeyDer = skDer1;

        // If public missing, try PEM alternatives if present
        if (publicKeyDer == null)
        {
            TryGetDerBytes(jwtSettings["PublicKeyPem"], out var pkPemDer);
            if (pkPemDer?.Length > 0) publicKeyDer = pkPemDer;
        }
        if (privateKeyDer == null)
        {
            TryGetDerBytes(jwtSettings["PrivateKeyPem"], out var skPemDer);
            if (skPemDer?.Length > 0) privateKeyDer = skPemDer;
        }

        // Derive/generate as needed
        if (publicKeyDer == null)
        {
            if (privateKeyDer != null)
            {
                using var rsaTmp = RSA.Create();
                rsaTmp.ImportPkcs8PrivateKey(privateKeyDer, out _);
                publicKeyDer = rsaTmp.ExportSubjectPublicKeyInfo();
            }
            else if (string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
            {
                // Generate ephemeral dev key material and make it available via DI for JwtService
                using var rsaGen = RSA.Create(2048);
                privateKeyDer = rsaGen.ExportPkcs8PrivateKey();
                publicKeyDer = rsaGen.ExportSubjectPublicKeyInfo();
                keyId ??= "dev-1"; // Use consistent dev keyId instead of timestamp
            }
            else
            {
                throw new InvalidOperationException("Missing or invalid JwtSettings:PublicKey. Provide Base64 DER (SubjectPublicKeyInfo) or set valid keys. In non-development environments, keys are required.");
            }
        }

        // Ensure we have a KeyId
        if (string.IsNullOrEmpty(keyId))
        {
            keyId = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase) ? "dev-1" : "prod-1";
        }

        // Build RSA key for JWT validation using RSAParameters so no disposed object is referenced later
        RSAParameters rsaParameters;
        using (var rsaForParams = RSA.Create())
        {
            rsaForParams.ImportSubjectPublicKeyInfo(publicKeyDer, out _);
            rsaParameters = rsaForParams.ExportParameters(false);
        }
        var rsaKey = new RsaSecurityKey(rsaParameters);
        rsaKey.KeyId = keyId; // Always set the KeyId

        // Expose key material (generated or configured) to JwtService via DI
        var material = new JwtKeyMaterial
        {
            PublicKeyBase64 = Convert.ToBase64String(publicKeyDer),
            PrivateKeyBase64 = privateKeyDer != null ? Convert.ToBase64String(privateKeyDer) : null,
            KeyId = keyId
        };
        services.AddSingleton(material);

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
                IssuerSigningKey = rsaKey,
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                NameClaimType = ClaimTypes.NameIdentifier,
                RequireSignedTokens = true, // Ensure tokens must be signed
                // Add keys collection for proper validation
                IssuerSigningKeys = new List<SecurityKey> { rsaKey }
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
        services.AddScoped<Application.Common.Interfaces.IIdentityService, IdentityService>();
        services.AddScoped<IUserLookupService, UserLookupService>();
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<Application.Interfaces.IOrderNotificationService, OrderNotificationService>();
        
        // Register new wallet topup services
        services.AddScoped<YaqeenPay.Application.Features.Wallets.Services.IWalletTopupService, 
                          YaqeenPay.Application.Features.Wallets.Services.WalletTopupService>();
        services.AddScoped<YaqeenPay.Application.Features.Wallets.Services.IQrCodeService, 
                          YaqeenPay.Application.Features.Wallets.Services.QrCodeService>();
    services.AddScoped<YaqeenPay.Application.Features.Wallets.Services.IBankSmsProcessingService,
              YaqeenPay.Application.Features.Wallets.Services.BankSmsProcessingService>();
        
        // Register background service for cleanup
        services.AddHostedService<YaqeenPay.Infrastructure.Services.TopupLockCleanupService>();
        
        // Register repositories
    services.AddScoped<IWalletRepository, WalletRepository>();
        services.AddScoped<IWalletTransactionRepository, WalletTransactionRepository>();
        services.AddScoped<ITopUpRepository, TopUpRepository>();
        services.AddScoped<IAdminSystemSettingsRepository, AdminSystemSettingsRepository>();
        services.AddScoped<IAdminSettingsAuditRepository, AdminSettingsAuditRepository>();
        services.AddScoped<IRatingRepository, RatingRepository>();
    // Product reviews repository will use EF directly for now - register if/when a custom repo is added

        // Register OutboxService for notifications
        services.AddScoped<IOutboxService, OutboxService>();
        services.Configure<Services.OutboxDispatcherOptions>(configuration.GetSection("OutboxDispatcher"));
        services.Configure<Services.MacroDroidOptions>(configuration.GetSection("MacroDroid"));
    services.AddHttpClient(); // default client for external calls (MacroDroid)
    services.AddScoped<YaqeenPay.Application.Common.Interfaces.ISmsSender, YaqeenPay.Infrastructure.Services.Sms.MacroDroidSmsSender>();
    services.AddHostedService<Services.OutboxDispatcherService>();

        // Redis & OTP - Use in-memory OTP service if Redis is disabled in configuration
        var useInMemoryOtp = configuration["Redis:UseInMemory"] == "true";
        if (useInMemoryOtp)
        {
            services.AddSingleton<IOtpService, InMemoryOtpService>();
        }
        else
        {
            // Redis & OTP (resilient connection)
            var redisConnection = configuration.GetSection("Redis")["ConnectionString"] ?? "localhost:6379";
            var redisOptions = ConfigurationOptions.Parse(redisConnection);
            redisOptions.AllowAdmin = false;
            // Ensure the multiplexer keeps retrying instead of throwing on startup
            redisOptions.AbortOnConnectFail = false;
            // Reasonable defaults for local/dev
            if (redisOptions.ConnectRetry == 0) redisOptions.ConnectRetry = 3;
            if (redisOptions.ConnectTimeout == 0) redisOptions.ConnectTimeout = 5000;
            services.AddSingleton<IConnectionMultiplexer>(sp => ConnectionMultiplexer.Connect(redisOptions));
            services.AddScoped<IOtpService, RedisOtpService>();
        }

        return services;
    }
}
