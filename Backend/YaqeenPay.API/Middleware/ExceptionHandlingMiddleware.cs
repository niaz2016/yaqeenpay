using System.Net;
using System.Text.Json;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);

        var statusCode = HttpStatusCode.InternalServerError;
        var errorResponse = new ApiResponse<object>();

        errorResponse.Success = false;
        errorResponse.Message = "An error occurred while processing your request.";

        switch (exception)
        {
            case ValidationException validationException:
                statusCode = HttpStatusCode.BadRequest;
                errorResponse.Message = "Validation error";
                errorResponse.Errors = validationException.Errors.SelectMany(e => e.Value).ToList();
                break;

            case NotFoundException notFoundException:
                statusCode = HttpStatusCode.NotFound;
                errorResponse.Message = notFoundException.Message;
                break;

            case ForbiddenAccessException:
                statusCode = HttpStatusCode.Forbidden;
                errorResponse.Message = "You don't have permission to access this resource.";
                break;

            default:
                // For unhandled exceptions, don't reveal details in production
                if (_environment.IsDevelopment())
                {
                    errorResponse.Message = exception.Message;
                    errorResponse.Errors = new List<string> { exception.StackTrace ?? string.Empty };
                }
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
    }
}