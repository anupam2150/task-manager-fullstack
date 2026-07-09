namespace TaskManager.API.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int OwnerId { get; set; }
    public string? ShareToken { get; set; }
    public User Owner { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = [];
}
