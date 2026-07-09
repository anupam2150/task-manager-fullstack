namespace TaskManager.API.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;   // e.g. "Status changed to Done"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
