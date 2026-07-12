namespace TaskManager.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info | warning | error
    public bool IsRead { get; set; } = false;
    public int? TaskId { get; set; }
    public int? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
