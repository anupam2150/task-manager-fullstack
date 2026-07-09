using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.Projects.Where(p => p.OwnerId == UserId);
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Description, p.CreatedAt, p.OwnerId))
            .ToListAsync();
        return Ok(new PagedResult<ProjectDto>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == UserId);
        return project is null ? NotFound() : Ok(new ProjectDto(project.Id, project.Name, project.Description, project.CreatedAt, project.OwnerId));
    }

    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> Create(CreateProjectDto dto)
    {
        var project = new Project { Name = dto.Name, Description = dto.Description, OwnerId = UserId };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = project.Id },
            new ProjectDto(project.Id, project.Name, project.Description, project.CreatedAt, project.OwnerId));
    }

    [HttpPut("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Update(int id, UpdateProjectDto dto)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == UserId);
        if (project is null) return NotFound();
        project.Name = dto.Name;
        project.Description = dto.Description;
        await db.SaveChangesAsync();
        return Ok(new ProjectDto(project.Id, project.Name, project.Description, project.CreatedAt, project.OwnerId));
    }

    [HttpDelete("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Delete(int id)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == UserId);
        if (project is null) return NotFound();
        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
