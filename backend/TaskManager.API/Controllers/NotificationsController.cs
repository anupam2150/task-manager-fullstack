using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var notifs = await db.Notifications
            .Where(n => n.UserId == UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new { n.Id, n.Message, n.Type, n.IsRead, n.TaskId, n.ProjectId, n.CreatedAt })
            .ToListAsync();
        return Ok(notifs);
    }

    [HttpPost("mark-read")]
    [Consumes("application/json")]
    public async Task<IActionResult> MarkAllRead()
    {
        await db.Notifications
            .Where(n => n.UserId == UserId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Delete(int id)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == UserId);
        if (n is null) return NotFound();
        db.Notifications.Remove(n);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("generate")]
    [Consumes("application/json")]
    public async Task<IActionResult> Generate()
    {
        var now = DateTime.UtcNow;
        var projectIds = await db.Projects.Where(p => p.OwnerId == UserId).Select(p => p.Id).ToListAsync();

        var overdueTasks = await db.Tasks
            .Where(t => projectIds.Contains(t.ProjectId) && t.DueDate.HasValue
                && t.DueDate < now && t.Status != Models.TaskStatus.Done && !t.IsArchived)
            .Select(t => new { t.Id, t.Title, t.ProjectId })
            .ToListAsync();

        var dueSoonTasks = await db.Tasks
            .Where(t => projectIds.Contains(t.ProjectId) && t.DueDate.HasValue
                && t.DueDate >= now && t.DueDate <= now.AddDays(3)
                && t.Status != Models.TaskStatus.Done && !t.IsArchived)
            .Select(t => new { t.Id, t.Title, t.ProjectId })
            .ToListAsync();

        var existing = await db.Notifications
            .Where(n => n.UserId == UserId && n.CreatedAt >= now.AddHours(-12))
            .Select(n => n.TaskId)
            .ToListAsync();

        var toAdd = new List<Notification>();

        foreach (var t in overdueTasks.Where(t => !existing.Contains(t.Id)))
            toAdd.Add(new Notification { UserId = UserId, Message = $"🚨 \"{t.Title}\" is overdue", Type = "error", TaskId = t.Id, ProjectId = t.ProjectId });

        foreach (var t in dueSoonTasks.Where(t => !existing.Contains(t.Id)))
            toAdd.Add(new Notification { UserId = UserId, Message = $"⏰ \"{t.Title}\" is due soon", Type = "warning", TaskId = t.Id, ProjectId = t.ProjectId });

        if (toAdd.Count > 0)
        {
            db.Notifications.AddRange(toAdd);
            await db.SaveChangesAsync();
        }

        return Ok(new { generated = toAdd.Count });
    }
}
