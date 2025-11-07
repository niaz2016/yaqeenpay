using Microsoft.OpenApi.Models;
using YaqeenPay.API.Middleware;
using YaqeenPay.API.Services;
using YaqeenPay.Application;
using YaqeenPay.Infrastructure;
using YaqeenPay.Infrastructure.Identity;
using YaqeenPay.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "YaqeenPay API", Version = "v1" });
    
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
builder.Services.Configure<YaqeenPay.Application.Common.Models.EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

// Configure Analytics Settings
builder.Services.Configure<YaqeenPay.API.Configuration.AnalyticsSettings>(
    builder.Configuration.GetSection(YaqeenPay.API.Configuration.AnalyticsSettings.SectionName));
builder.Services.AddSingleton<YaqeenPay.Application.Common.Interfaces.IAnalyticsSettings>(sp => 
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<YaqeenPay.API.Configuration.AnalyticsSettings>>().Value);

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
