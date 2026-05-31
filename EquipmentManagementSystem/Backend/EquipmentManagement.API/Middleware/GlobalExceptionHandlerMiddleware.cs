using EquipmentManagement.Core.DTOs;
using System.Net;
using System.Text.Json;

namespace EquipmentManagement.API.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An error occurred while processing your request";
        string? details = null;

        switch (exception)
        {
            case ArgumentNullException:
                statusCode = HttpStatusCode.BadRequest;
                message = "Invalid input";
                details = exception.Message;
                break;
            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                message = "Resource not found";
                details = exception.Message;
                break;
            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                message = "Unauthorized access";
                details = exception.Message;
                break;
            default:
                details = exception.Message;
                break;
        }

        var errorResponse = new ErrorResponse
        {
            StatusCode = (int)statusCode,
            Message = message,
            Details = details
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(errorResponse);
        return context.Response.WriteAsync(json);
    }
}
