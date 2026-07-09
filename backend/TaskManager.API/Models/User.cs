namespace TaskManager.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<TaskItem> AssignedTasks { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Label> Labels { get; set; } = [];
    public ICollection<ActivityLog> ActivityLogs { get; set; } = [];
}
