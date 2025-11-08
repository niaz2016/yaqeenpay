using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.Analytics.Commands.TrackPageView;
using YaqeenPay.Application.Features.Analytics.Queries.GetAnalytics;
using YaqeenPay.Application.Features.Analytics.Queries.GetSellerProductViews;
using YaqeenPay.Application.Features.Analytics.Queries.GetSellerSummary;
using System.Security.Claims;

namespace YaqeenPay.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("track")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackPageView([FromBody] TrackPageViewCommand command)
    {
        // Get IP address from request
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();
        var referrer = Request.Headers["Referer"].ToString();

        var updatedCommand = command with
        {
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Referrer = referrer
        };

        var result = await _mediator.Send(updatedCommand);
        return Ok(new { success = result });
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminAnalytics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = new GetAnalyticsQuery
        {
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("seller/products")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetSellerProductViews()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var query = new GetSellerProductViewsQuery
        {
            SellerId = userId
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("seller/summary")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetSellerSummary()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var query = new GetSellerSummaryQuery
        {
            SellerId = userId
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("visitors")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetVisitorStats([FromQuery] int page = 1, [FromQuery] int pageSize = 100, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
    {
        var query = new YaqeenPay.Application.Features.Analytics.Queries.GetVisitorStats.GetVisitorStatsQuery
        {
            Page = page,
            PageSize = pageSize,
            StartDate = startDate,
            EndDate = endDate
            ,
            SortBy = sortBy,
            SortDir = sortDir
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
