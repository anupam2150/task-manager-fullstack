using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.DTOs;
using TaskManager.API.Models;

namespace TaskManager.API.Controllers;

[ApiController]
[Route("api/labels")]
[Authorize]
public class LabelsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Labels.Where(l => l.OwnerId == UserId)
            .Select(l => new LabelDto(l.Id, l.Name, l.Color)).ToListAsync());

    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> Create(CreateLabelDto dto)
    {
        var label = new Label { Name = dto.Name, Color = dto.Color, OwnerId = UserId };
        db.Labels.Add(label);
        await db.SaveChangesAsync();
        return Ok(new LabelDto(label.Id, label.Name, label.Color));
    }

    [HttpDelete("{id}")]
    [Consumes("application/json")]
    public async Task<IActionResult> Delete(int id)
    {
        var label = await db.Labels.FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == UserId);
        if (label is null) return NotFound();
        db.Labels.Remove(label);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
