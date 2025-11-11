using Microsoft.OpenApi.Models;
using TechTorio.API.Middleware;
using TechTorio.API.Services;
using TechTorio.API.Hubs;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application;
using TechTorio.Infrastructure;
using TechTorio.Infrastructure.Identity;
using TechTorio.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using TechTorio.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Register SignalR and device push/registry services used for device persistent connections (SignalR)
builder.Services.AddSignalR();
// DeviceConnectionManager keeps runtime mappings - singleton so connections remain tracked
builder.Services.AddSingleton<TechTorio.Application.Common.Interfaces.IDeviceRegistry, TechTorio.API.Services.DeviceConnectionManager>();
builder.Services.AddScoped<TechTorio.Application.Common.Interfaces.IDevicePushService, TechTorio.API.Services.SignalRDevicePushService>();

// Add Memory Cache for AdminConfigurationService
builder.Services.AddMemoryCache();

// Add Response Compression (Gzip/Brotli) for 70-80% size reduction
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});

// Configure Kestrel to allow larger request bodies (for file uploads)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 52_428_800; // 50MB
});

// Configure FormOptions for multipart form data (file uploads)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 52_428_800; // 50MB
    options.MultipartHeadersLengthLimit = 16384;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add API Explorer and Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TechTorio API", Version = "v1" });
    
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });

    // Configure Swagger to handle file uploads properly
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    // Configure custom schema IDs to avoid conflicts with duplicate class names
    c.CustomSchemaIds(type => 
    {
        // Use full type name including namespace to avoid conflicts
        return type.FullName?.Replace("+", ".") ?? type.Name;
    });
});

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // In Development: allow everything for ease of testing
        if (builder.Environment.IsDevelopment())
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
            return;
        }

        // In Production: echo back any Origin (including capacitor://localhost) safely
        // so preflight succeeds and the browser sees proper CORS headers.
        policy
            .SetIsOriginAllowed(_ => true) // reflect request origin
            .AllowAnyMethod()
            .AllowAnyHeader();

        // If you REQUIRE cookies, uncomment the next line and ensure responses do not use '*'
        // policy.AllowCredentials();
    });
});

// Configure Email Settings
builder.Services.Configure<TechTorio.Application.Common.Models.EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

// Configure Analytics Settings
builder.Services.Configure<TechTorio.API.Configuration.AnalyticsSettings>(
    builder.Configuration.GetSection(TechTorio.API.Configuration.AnalyticsSettings.SectionName));
builder.Services.AddSingleton<TechTorio.Application.Common.Interfaces.IAnalyticsSettings>(sp => 
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TechTorio.API.Configuration.AnalyticsSettings>>().Value);

// Add data migration service
builder.Services.AddTransient<DataMigrationService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    // Use the custom exception handler middleware in production
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Custom exception middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable response compression
app.UseResponseCompression();

// Diagnostic middleware: log incoming negotiate requests so we can see method/headers
// This helps diagnose cases where POST->GET conversion happens (redirects/proxy issues).
app.Use(async (context, next) =>
{
    try
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/hubs/device", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/hubs/device", StringComparison.OrdinalIgnoreCase))
        {
            var logger = app.Logger;
            logger.LogInformation("SignalR diagnostic - incoming request: {Method} {Path}", context.Request.Method, context.Request.Path);
            // Log a few helpful headers
            if (context.Request.Headers.ContainsKey("X-Forwarded-Proto"))
                logger.LogInformation("SignalR diagnostic - X-Forwarded-Proto: {Value}", context.Request.Headers["X-Forwarded-Proto"].ToString());
            if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
                logger.LogInformation("SignalR diagnostic - X-Forwarded-For: {Value}", context.Request.Headers["X-Forwarded-For"].ToString());
            if (context.Request.Headers.ContainsKey("Upgrade"))
                logger.LogInformation("SignalR diagnostic - Upgrade: {Value}", context.Request.Headers["Upgrade"].ToString());
            if (context.Request.Headers.ContainsKey("Connection"))
                logger.LogInformation("SignalR diagnostic - Connection: {Value}", context.Request.Headers["Connection"].ToString());
        }
    }
    catch { /* swallow logging errors to avoid interfering with request processing */ }
    await next();
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Serve static files (wwwroot) so uploaded files under wwwroot/uploads are accessible
app.UseStaticFiles();

// Serve KYC documents from Documents folder
var documentsPath = builder.Configuration["DocumentStorage:BasePath"] 
    ?? Path.Combine(Directory.GetCurrentDirectory(), "Documents");

if (!Directory.Exists(documentsPath))
{
    Directory.CreateDirectory(documentsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(documentsPath),
    RequestPath = "/documents",
    OnPrepareResponse = ctx =>
    {
        // Add security headers for document access
        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        
        // Allow documents to be viewed in browser
        var fileExtension = Path.GetExtension(ctx.File.Name).ToLowerInvariant();
        if (fileExtension == ".pdf")
        {
            ctx.Context.Response.Headers.Append("Content-Disposition", "inline");
        }
    }
});

app.MapControllers();

// Map SignalR hubs
app.MapHub<DeviceHub>("/hubs/device");
// Also map under /api/hubs/device as some reverse-proxy setups forward to an '/api' prefix.
// This is a low-risk, backward compatible fallback so clients that connect to
// https://example.com/api/hubs/device will succeed even when the app is hosted at root.
app.MapHub<DeviceHub>("/api/hubs/device");

// Lightweight health endpoint for Docker healthcheck
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Apply migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();

        // Ensure database exists and apply any pending migrations
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        logger.LogInformation("Applying database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database is up-to-date.");

        var migrationService = services.GetRequiredService<DataMigrationService>();
        await migrationService.MigrateOldJwtDataAsync();
        
        // Seed roles
        var roleSeedService = services.GetRequiredService<RoleSeedService>();
        await roleSeedService.SeedRolesAsync();
        
        // Seed categories
        var categorySeedService = services.GetRequiredService<CategorySeedService>();
        await categorySeedService.SeedDefaultCategoriesAsync();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration");
    }
}

app.Run();
