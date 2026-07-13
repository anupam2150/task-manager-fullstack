using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskManager.API.Data;
using TaskManager.API.Middleware;
using TaskManager.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
});

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var dbPath = Path.Combine(builder.Environment.ContentRootPath, "taskmanager.db");
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite($"Data Source={dbPath}"));

var jwtKey = Environment.GetEnvironmentVariable("JWT__Key")
    ?? builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured.");

builder.Services.AddScoped<JwtService>(sp =>
    new JwtService(builder.Configuration, jwtKey));

builder.Services.AddHostedService<RecurringTaskService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowFrontend", p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()));

builder.Services.AddRateLimiter(opt =>
{
    // Auth endpoints: 5 requests per minute (brute-force protection)
    opt.AddFixedWindowLimiter("auth", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
    // Global limit: 100 requests per minute per client
    opt.AddFixedWindowLimiter("global", o =>
    {
        o.PermitLimit = 100;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 5;
    });
    opt.RejectionStatusCode = 429;
    opt.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            }));
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseRateLimiter();
app.UseCors("AllowFrontend");
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'none';");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed admin account flag + system templates
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Grant admin to accounts owned by Anupam Shinde
    var adminUsernames = new[] { "admin", "anupam", "snivo", "demo", "testuser" };
    var adminUsers = db.Users.Where(u => adminUsernames.Contains(u.Username.ToLower())).ToList();
    foreach (var u in adminUsers)
        u.IsAdmin = true;
    if (adminUsers.Count > 0) db.SaveChanges();
    if (!db.TaskTemplates.Any(t => t.IsSystem))
    {
        db.TaskTemplates.AddRange(
            new() { OwnerId = null, IsSystem = true, Category = "Dev", Name = "Bug Report", Title = "Bug: ", Description = "Steps to reproduce:\n1. \n\nExpected:\nActual:", Priority = "High", SubtaskTitles = "[\"Reproduce the bug\",\"Identify root cause\",\"Write fix\",\"Test fix\"]"},
            new() { OwnerId = null, IsSystem = true, Category = "Dev", Name = "Feature Request", Title = "Feature: ", Description = "User story: As a user I want to...", Priority = "Medium", SubtaskTitles = "[\"Design\",\"Implement\",\"Write tests\",\"Update docs\"]"},
            new() { OwnerId = null, IsSystem = true, Category = "Dev", Name = "Code Review", Title = "Review: ", Description = "PR link:\nFocus areas:", Priority = "Medium", SubtaskTitles = "[\"Check logic\",\"Check edge cases\",\"Check naming\",\"Approve or request changes\"]"},
            new() { OwnerId = null, IsSystem = true, Category = "General", Name = "Meeting Notes", Title = "Meeting: ", Description = "Attendees:\nAgenda:\nAction items:", Priority = "Low", SubtaskTitles = "[\"Send agenda\",\"Take notes\",\"Share summary\"]"},
            new() { OwnerId = null, IsSystem = true, Category = "General", Name = "Weekly Goals", Title = "Week of ", Description = "Top 3 goals this week:", Priority = "Medium", SubtaskTitles = "[\"Goal 1\",\"Goal 2\",\"Goal 3\",\"Review progress\"]"}
        );
        db.SaveChanges();
    }
}

app.Run();
