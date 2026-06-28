using System.Net;
using System.Text.Json;

namespace TaskManager.API.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var sanitizedMethod = context.Request.Method.Replace("\n", "").Replace("\r", "");
            var sanitizedPath = context.Request.Path.ToString().Replace("\n", "").Replace("\r", "");
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", sanitizedMethod, sanitizedPath);
            await WriteErrorResponse(context);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new { error = "An unexpected error occurred. Please try again later." };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
