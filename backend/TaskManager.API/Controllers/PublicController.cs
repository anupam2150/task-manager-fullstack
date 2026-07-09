using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(AppDbContext db) : ControllerBase
{
    [HttpGet("projects/{token}")]
    public async Task<IActionResult> GetSharedProject(string token)
    {
        var project = await db.Projects
            .Where(p => p.ShareToken == token)
            .Select(p => new
            {
                p.Id, p.Name, p.Description, p.CreatedAt,
                Tasks = p.Tasks
                    .Where(t => !t.IsArchived)
                    .Select(t => new
                    {
                        t.Id, t.Title, t.Description,
                        Status = t.Status.ToString(),
                        Priority = t.Priority.ToString(),
                        t.DueDate, t.CreatedAt
                    })
            })
            .FirstOrDefaultAsync();

        if (project is null) return NotFound();
        return Ok(project);
    }
}
