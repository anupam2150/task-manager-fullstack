using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/projects/{projectId}/tasks")]
[Authorize]
public class TasksController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private TaskDto ToDto(TaskItem t) =>
        new(t.Id, t.Title, t.Description, t.Status, t.Priority, t.DueDate, t.CreatedAt, t.ProjectId, t.AssignedToId);

    private async Task<bool> ProjectBelongsToUser(int projectId) =>
        await db.Projects.AnyAsync(p => p.Id == projectId && p.OwnerId == UserId);

    [HttpGet]
    public async Task<IActionResult> GetAll(int projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Tasks.Where(t => t.ProjectId == projectId);
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => ToDto(t))
            .ToListAsync();
        return Ok(new PagedResult<TaskDto>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);
        return task is null ? NotFound() : Ok(ToDto(task));
    }

    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> Create(int projectId, CreateTaskDto dto)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = new TaskItem
        {
            Title = dto.Title, Description = dto.Description,
            Priority = dto.Priority, DueDate = dto.DueDate,
            AssignedToId = dto.AssignedToId, ProjectId = projectId
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { projectId, id = task.Id }, ToDto(task));
    }

    [HttpPut("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Update(int projectId, int id, UpdateTaskDto dto)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);
        if (task is null) return NotFound();
        task.Title = dto.Title; task.Description = dto.Description;
        task.Status = dto.Status; task.Priority = dto.Priority;
        task.DueDate = dto.DueDate; task.AssignedToId = dto.AssignedToId;
        await db.SaveChangesAsync();
        return Ok(ToDto(task));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);
        if (task is null) return NotFound();
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
