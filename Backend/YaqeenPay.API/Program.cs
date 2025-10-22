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
        policy.WithOrigins(
                  "http://localhost",
                  "https://localhost",
                  "http://127.0.0.1",
                  "https://127.0.0.1",
                  "capacitor://localhost")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

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

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Serve static files (wwwroot) so uploaded files under wwwroot/uploads are accessible
app.UseStaticFiles();

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
