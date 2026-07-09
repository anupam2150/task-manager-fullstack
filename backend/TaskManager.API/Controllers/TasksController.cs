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

    private static TaskDto ToDto(TaskItem t) => new(
        t.Id, t.Title, t.Description, t.Status, t.Priority,
        t.DueDate, t.CreatedAt, t.ProjectId, t.AssignedToId,
        t.TaskLabels.Select(tl => new LabelDto(tl.Label.Id, tl.Label.Name, tl.Label.Color)).ToList(),
        t.SubTasks.Select(s => new SubTaskDto(s.Id, s.Title, s.IsCompleted)).ToList(),
        t.Comments.Select(c => new CommentDto(c.Id, c.Content, c.CreatedAt, c.Author.Username)).ToList()
    );

    private async Task<bool> ProjectBelongsToUser(int projectId) =>
        await db.Projects.AnyAsync(p => p.Id == projectId && p.OwnerId == UserId);

    private IQueryable<TaskItem> TasksWithIncludes(int projectId) =>
        db.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .Include(t => t.SubTasks)
            .Include(t => t.Comments).ThenInclude(c => c.Author);

    [HttpGet]
    public async Task<IActionResult> GetAll(int projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = TasksWithIncludes(projectId);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new PagedResult<TaskDto>(items.Select(ToDto), total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = await TasksWithIncludes(projectId).FirstOrDefaultAsync(t => t.Id == id);
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
        var created = await TasksWithIncludes(projectId).FirstAsync(t => t.Id == task.Id);
        return CreatedAtAction(nameof(Get), new { projectId, id = task.Id }, ToDto(created));
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
        var updated = await TasksWithIncludes(projectId).FirstAsync(t => t.Id == id);
        return Ok(ToDto(updated));
    }

    [HttpDelete("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Delete(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);
        if (task is null) return NotFound();
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Labels ──
    [HttpPost("{id}/labels/{labelId}")]
    [Consumes("application/json")]
    public async Task<IActionResult> AddLabel(int projectId, int id, int labelId)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        if (await db.TaskLabels.AnyAsync(tl => tl.TaskId == id && tl.LabelId == labelId)) return Ok();
        db.TaskLabels.Add(new TaskLabel { TaskId = id, LabelId = labelId });
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/labels/{labelId}")]
    [Consumes("application/json")]
    public async Task<IActionResult> RemoveLabel(int projectId, int id, int labelId)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var tl = await db.TaskLabels.FirstOrDefaultAsync(tl => tl.TaskId == id && tl.LabelId == labelId);
        if (tl is null) return NotFound();
        db.TaskLabels.Remove(tl);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Subtasks ──
    [HttpGet("{id}/subtasks")]
    public async Task<IActionResult> GetSubTasks(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var subtasks = await db.SubTasks.Where(s => s.TaskId == id)
            .Select(s => new SubTaskDto(s.Id, s.Title, s.IsCompleted)).ToListAsync();
        return Ok(subtasks);
    }

    [HttpPost("{id}/subtasks")]
    [Consumes("application/json")]
    public async Task<IActionResult> AddSubTask(int projectId, int id, CreateSubTaskDto dto)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var subtask = new SubTask { Title = dto.Title, TaskId = id };
        db.SubTasks.Add(subtask);
        await db.SaveChangesAsync();
        return Ok(new SubTaskDto(subtask.Id, subtask.Title, subtask.IsCompleted));
    }

    [HttpPut("{id}/subtasks/{subId}")]
    [Consumes("application/json")]
    public async Task<IActionResult> UpdateSubTask(int projectId, int id, int subId, UpdateSubTaskDto dto)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var subtask = await db.SubTasks.FirstOrDefaultAsync(s => s.Id == subId && s.TaskId == id);
        if (subtask is null) return NotFound();
        subtask.Title = dto.Title;
        subtask.IsCompleted = dto.IsCompleted;
        await db.SaveChangesAsync();
        return Ok(new SubTaskDto(subtask.Id, subtask.Title, subtask.IsCompleted));
    }

    [HttpDelete("{id}/subtasks/{subId}")]
    [Consumes("application/json")]
    public async Task<IActionResult> DeleteSubTask(int projectId, int id, int subId)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var subtask = await db.SubTasks.FirstOrDefaultAsync(s => s.Id == subId && s.TaskId == id);
        if (subtask is null) return NotFound();
        db.SubTasks.Remove(subtask);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Comments ──
    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int projectId, int id)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var comments = await db.Comments.Where(c => c.TaskId == id)
            .Include(c => c.Author)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.Content, c.CreatedAt, c.Author.Username))
            .ToListAsync();
        return Ok(comments);
    }

    [HttpPost("{id}/comments")]
    [Consumes("application/json")]
    public async Task<IActionResult> AddComment(int projectId, int id, CreateCommentDto dto)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var comment = new Comment { Content = dto.Content, TaskId = id, AuthorId = UserId };
        db.Comments.Add(comment);
        await db.SaveChangesAsync();
        await db.Entry(comment).Reference(c => c.Author).LoadAsync();
        return Ok(new CommentDto(comment.Id, comment.Content, comment.CreatedAt, comment.Author.Username));
    }

    [HttpDelete("{id}/comments/{commentId}")]
    [Consumes("application/json")]
    public async Task<IActionResult> DeleteComment(int projectId, int id, int commentId)
    {
        if (!await ProjectBelongsToUser(projectId)) return Forbid();
        var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == id && c.AuthorId == UserId);
        if (comment is null) return NotFound();
        db.Comments.Remove(comment);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
