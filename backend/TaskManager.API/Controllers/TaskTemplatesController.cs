using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/templates")]
[Authorize]
public class TaskTemplatesController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var templates = await db.TaskTemplates
            .Where(t => t.IsSystem || t.OwnerId == UserId)
            .OrderBy(t => t.IsSystem).ThenBy(t => t.Category).ThenBy(t => t.Name)
            .Select(t => new { t.Id, t.Name, t.Category, t.Title, t.Description, t.Priority, t.SubtaskTitles, t.IsSystem })
            .ToListAsync();
        return Ok(templates);
    }

    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> Create(CreateTemplateDto dto)
    {
        var template = new TaskTemplate
        {
            OwnerId = UserId,
            Name = dto.Name,
            Category = dto.Category ?? "General",
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority ?? "Medium",
            SubtaskTitles = dto.SubtaskTitles,
            IsSystem = false
        };
        db.TaskTemplates.Add(template);
        await db.SaveChangesAsync();
        return Ok(new { template.Id, template.Name, template.Category, template.Title, template.Description, template.Priority, template.SubtaskTitles, template.IsSystem });
    }

    [HttpDelete("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await db.TaskTemplates.FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == UserId && !t.IsSystem);
        if (t is null) return NotFound();
        db.TaskTemplates.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateTemplateDto(string Name, string Title, string? Category, string? Description, string? Priority, string? SubtaskTitles);
