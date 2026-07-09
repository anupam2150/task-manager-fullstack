namespace TaskManager.API.Models;

public class TaskDependency
{
    public int BlockerId { get; set; }
    public TaskItem Blocker { get; set; } = null!;
    public int BlockedId { get; set; }
    public TaskItem Blocked { get; set; } = null!;
}
