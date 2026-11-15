using BizConnect.Application.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Api.Middleware;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var status = exception switch
        {
            ApiException apiException => apiException.StatusCode,
            DbUpdateException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
        var code = exception switch
        {
            ApiException apiException => apiException.Code,
            DbUpdateException => "PERSISTENCE_CONFLICT",
            _ => "INTERNAL_ERROR"
        };
        var title = status switch
        {
            400 => "Request validation failed",
            401 => "Authentication required",
            403 => "Access denied",
            404 => "Resource not found",
            409 => "Resource conflict",
            422 => "Request could not be processed",
            429 => "Too many requests",
            503 => "Service unavailable",
            _ => "An unexpected error occurred"
        };
        if (status >= 500)
            logger.LogError(exception, "Unhandled API exception. TraceId={TraceId}", context.TraceIdentifier);
        else
            logger.LogInformation("API request rejected. Code={Code} TraceId={TraceId}", code, context.TraceIdentifier);

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Type = $"https://httpstatuses.com/{status}",
            Title = title,
            Status = status,
            Detail = exception is ApiException or DbUpdateException ? exception.Message : "The request could not be completed.",
            Instance = context.Request.Path
        };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = context.TraceIdentifier;
        await context.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
