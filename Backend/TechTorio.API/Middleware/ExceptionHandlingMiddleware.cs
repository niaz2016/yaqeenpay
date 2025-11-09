using System.Net;
using System.Text.Json;
using TechTorio.Application.Common.Exceptions;
using TechTorio.Application.Common.Models;

namespace TechTorio.API.Middleware;

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
        _logger.LogError(exception, "An unhandled exception occurred: {Message}. StackTrace: {StackTrace}", 
            exception.Message, exception.StackTrace);

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

            case UnauthorizedAccessException unauthorizedException:
                statusCode = HttpStatusCode.Unauthorized;
                errorResponse.Message = unauthorizedException.Message;
                break;

            case ArgumentException argumentException:
                statusCode = HttpStatusCode.BadRequest;
                errorResponse.Message = argumentException.Message;
                break;

            case InvalidOperationException invalidOpException:
                statusCode = HttpStatusCode.BadRequest;
                errorResponse.Message = invalidOpException.Message;
                if (_environment.IsDevelopment() && invalidOpException.InnerException != null)
                {
                    errorResponse.Errors = new List<string> { invalidOpException.InnerException.Message };
                }
                break;

            default:
                // For unhandled exceptions, reveal details in development
                if (_environment.IsDevelopment())
                {
                    errorResponse.Message = $"{exception.GetType().Name}: {exception.Message}";
                    var errors = new List<string>();
                    if (!string.IsNullOrEmpty(exception.StackTrace))
                    {
                        errors.Add(exception.StackTrace);
                    }
                    if (exception.InnerException != null)
                    {
                        errors.Add($"Inner Exception: {exception.InnerException.Message}");
                    }
                    errorResponse.Errors = errors;
                }
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
    }
}