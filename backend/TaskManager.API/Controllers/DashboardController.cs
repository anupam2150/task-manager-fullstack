using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var projectIds = await db.Projects
            .Where(p => p.OwnerId == UserId)
            .Select(p => p.Id)
            .ToListAsync();
        var tasks = await db.Tasks
            .Where(t => projectIds.Contains(t.ProjectId))
            .ToListAsync();
        var now = DateTime.UtcNow;

        var result = new
        {
            totalProjects = projectIds.Count,
            totalTasks = tasks.Count,
            todo = tasks.Count(t => t.Status == Models.TaskStatus.Todo),
            inProgress = tasks.Count(t => t.Status == Models.TaskStatus.InProgress),
            done = tasks.Count(t => t.Status == Models.TaskStatus.Done),
            overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate < now && t.Status != Models.TaskStatus.Done),
            dueSoon = tasks.Count(t => t.DueDate.HasValue && t.DueDate >= now && t.DueDate <= now.AddDays(3) && t.Status != Models.TaskStatus.Done),
            highPriority = tasks.Count(t => t.Priority == TaskPriority.High && t.Status != Models.TaskStatus.Done),
            completionRate = tasks.Count == 0 ? 0 : (int)Math.Round((double)tasks.Count(t => t.Status == Models.TaskStatus.Done) / tasks.Count * 100),
            recentTasks = tasks
                .OrderByDescending(t => t.CreatedAt)
                .Take(10)
                .Select(t => new { t.Id, t.Title, t.Status, t.Priority, t.DueDate, t.ProjectId })
        };

        return Ok(result);
    }
}
