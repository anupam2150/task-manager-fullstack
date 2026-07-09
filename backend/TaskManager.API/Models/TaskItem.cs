namespace TaskManager.API.Models;

public enum TaskStatus { Todo, InProgress, Done }
public enum TaskPriority { Low, Medium, High }

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<SubTask> SubTasks { get; set; } = [];
    public ICollection<TaskLabel> TaskLabels { get; set; } = [];
    public ICollection<ActivityLog> ActivityLogs { get; set; } = [];
    public int TimeSpentSeconds { get; set; } = 0;
}
