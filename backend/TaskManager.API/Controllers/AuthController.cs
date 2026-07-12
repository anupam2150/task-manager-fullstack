using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;
using TaskManager.API.Models;
using TaskManager.API.Services;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, JwtService jwt) : ControllerBase
{
    // Usernames that only the admin (Anupam Shinde) can create
    private static readonly HashSet<string> ReservedUsernames =
        new(StringComparer.OrdinalIgnoreCase) { "demo", "testuser", "admin", "anupam", "snivo" };

    [HttpPost("register")]
    [Consumes("application/json")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        // Block reserved usernames from public registration
        if (ReservedUsernames.Contains(dto.Username))
            return BadRequest("This username is reserved and cannot be registered.");

        if (await db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already in use.");

        if (await db.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest("Username already taken.");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new AuthResponseDto(jwt.GenerateToken(user), user.Username, user.Email));
    }

    [HttpPost("login")]
    [Consumes("application/json")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials.");

        return Ok(new AuthResponseDto(jwt.GenerateToken(user), user.Username, user.Email));
    }

    // Admin-only: create a test/dummy account (only Anupam Shinde / IsAdmin users)
    [HttpPost("admin/create-account")]
    [Consumes("application/json")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> AdminCreateAccount(RegisterDto dto)
    {
        var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requester = await db.Users.FindAsync(requesterId);
        if (requester is null || !requester.IsAdmin)
            return Forbid();

        if (await db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already in use.");

        if (await db.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest("Username already taken.");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new { user.Id, user.Username, user.Email, message = "Account created successfully." });
    }
}
