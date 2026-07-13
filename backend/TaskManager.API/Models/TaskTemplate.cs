namespace TaskManager.API.Models;

public class TaskTemplate
{
    public int Id { get; set; }
    public int? OwnerId { get; set; }
    public User? Owner { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public string? SubtaskTitles { get; set; } // JSON array stored as string
    public bool IsSystem { get; set; } = false; // predefined templates
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
