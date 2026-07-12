using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await db.Users.FindAsync(UserId);
        if (user is null) return NotFound();
        return Ok(new { user.Id, user.Username, user.Email, user.AvatarUrl, user.CreatedAt });
    }

    [HttpPut]
    [Consumes("application/json")]
    public async Task<IActionResult> Update(UpdateProfileDto dto)
    {
        var user = await db.Users.FindAsync(UserId);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
            if (await db.Users.AnyAsync(u => u.Username == dto.Username && u.Id != UserId))
                return BadRequest("Username already taken.");
            user.Username = dto.Username;
        }

        if (!string.IsNullOrWhiteSpace(dto.CurrentPassword) && !string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest("Current password is incorrect.");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        }

        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.Username, user.Email, user.AvatarUrl, user.CreatedAt });
    }

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest("No file provided.");
        if (file.Length > 2 * 1024 * 1024) return BadRequest("File too large. Max 2MB.");

        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp")) return BadRequest("Only jpg, png, webp allowed.");

        var uploadsDir = Path.Combine(env.ContentRootPath, "wwwroot", "avatars");
        Directory.CreateDirectory(uploadsDir);

        // Use server-generated filename only — never trust client filename
        var fileName = $"{UserId}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        // Ensure resolved path stays within uploadsDir (path traversal guard)
        var resolvedPath = Path.GetFullPath(filePath);
        var resolvedDir  = Path.GetFullPath(uploadsDir);
        if (!resolvedPath.StartsWith(resolvedDir + Path.DirectorySeparatorChar))
            return BadRequest("Invalid file path.");

        using (var stream = new FileStream(resolvedPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var user = await db.Users.FindAsync(UserId);
        if (user is null) return NotFound();

        // Delete old avatar — sanitize stored URL before building path
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            var safeOldName = Path.GetFileName(user.AvatarUrl);
            var oldFile = Path.Combine(uploadsDir, safeOldName);
            var resolvedOld = Path.GetFullPath(oldFile);
            if (resolvedOld.StartsWith(resolvedDir + Path.DirectorySeparatorChar) && System.IO.File.Exists(resolvedOld))
                System.IO.File.Delete(resolvedOld);
        }

        user.AvatarUrl = $"/avatars/{fileName}";
        await db.SaveChangesAsync();

        return Ok(new { avatarUrl = user.AvatarUrl });
    }
}
