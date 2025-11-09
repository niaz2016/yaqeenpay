using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.API.Controllers;

[ApiController]
[Route("api/subdomain")]
public class SubdomainController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<SubdomainController> _logger;

    public SubdomainController(
        IApplicationDbContext context,
        ILogger<SubdomainController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("check")]
    public async Task<IActionResult> CheckAvailability([FromBody] CheckSubdomainRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Subdomain))
            {
                return BadRequest(new { message = "Subdomain name is required." });
            }

            var subdomain = request.Subdomain.Trim().ToLower();

            // Validate subdomain format
            if (!IsValidSubdomain(subdomain))
            {
                return BadRequest(new 
                { 
                    message = "Invalid subdomain format. Use only letters, numbers, and hyphens (3-63 characters)." 
                });
            }

            // Check reserved subdomains
            var reservedSubdomains = new[] 
            { 
                "www", "mail", "ftp", "admin", "api", "app", "dev", "test", 
                "staging", "prod", "status", "support", "help", "docs", "blog",
                "techtorio", "techtorio", "cdn", "static", "assets"
            };

            if (reservedSubdomains.Contains(subdomain))
            {
                return Ok(new 
                { 
                    available = false, 
                    message = "This subdomain is reserved for system use." 
                });
            }

            // Check if subdomain exists in database
            var exists = await _context.Subdomains
                .AnyAsync(s => s.Name.ToLower() == subdomain && 
                             (s.Status == "Approved" || s.Status == "Active" || s.Status == "Pending"), cancellationToken);

            return Ok(new 
            { 
                available = !exists,
                subdomain = subdomain
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subdomain availability");
            return StatusCode(500, new { message = "An error occurred while checking availability." });
        }
    }

    [HttpPost("request")]
    public async Task<IActionResult> RequestSubdomain([FromBody] SubdomainRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Subdomain))
            {
                return BadRequest(new { message = "Subdomain name is required." });
            }

            var subdomain = request.Subdomain.Trim().ToLower();

            if (!IsValidSubdomain(subdomain))
            {
                return BadRequest(new 
                { 
                    message = "Invalid subdomain format." 
                });
            }

            // Check if already exists
            var exists = await _context.Subdomains
                .AnyAsync(s => s.Name.ToLower() == subdomain, cancellationToken);

            if (exists)
            {
                return BadRequest(new { message = "This subdomain is already taken or requested." });
            }

            var subdomainEntity = new Domain.Entities.Subdomain
            {
                Name = subdomain,
                Status = "Pending",
                ApplicantEmail = request.Email,
                ApplicantName = request.Name,
                Purpose = request.Purpose,
                ContactPhone = request.Phone,
                RequestedAt = DateTime.UtcNow,
                IsActive = false
            };

            _context.Subdomains.Add(subdomainEntity);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new 
            { 
                success = true,
                message = "Subdomain request submitted successfully. You will be contacted via email.",
                requestId = subdomainEntity.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting subdomain");
            return StatusCode(500, new { message = "An error occurred while processing your request." });
        }
    }

    private bool IsValidSubdomain(string subdomain)
    {
        if (string.IsNullOrWhiteSpace(subdomain))
            return false;

        if (subdomain.Length < 3 || subdomain.Length > 63)
            return false;

        // Must start and end with alphanumeric
        if (!char.IsLetterOrDigit(subdomain[0]) || !char.IsLetterOrDigit(subdomain[^1]))
            return false;

        // Can only contain alphanumeric and hyphens
        return subdomain.All(c => char.IsLetterOrDigit(c) || c == '-');
    }
}

public class CheckSubdomainRequest
{
    public string Subdomain { get; set; } = string.Empty;
}

public class SubdomainRequest
{
    public string Subdomain { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Purpose { get; set; }
    public string? Phone { get; set; }
}
