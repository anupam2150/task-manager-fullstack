using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using TaskManager.API.Models;

namespace TaskManager.API.DTOs;

public record ProjectDto(int Id, string Name, string Description, DateTime CreatedAt, int OwnerId, int TaskCount = 0, int CompletedCount = 0);
public record CreateProjectDto([Required, StringLength(100, MinimumLength = 1)] string Name, [StringLength(500)] string Description);
public record UpdateProjectDto([Required, StringLength(100, MinimumLength = 1)] string Name, [StringLength(500)] string Description);

public record LabelDto(int Id, string Name, string Color);
public record CreateLabelDto([Required, StringLength(50)] string Name, [Required] string Color);

public record SubTaskDto(int Id, string Title, bool IsCompleted);
public record CreateSubTaskDto([Required, StringLength(200)] string Title);
public record UpdateSubTaskDto([Required, StringLength(200)] string Title, bool IsCompleted);

public record CommentDto(int Id, string Content, DateTime CreatedAt, string AuthorUsername);
public record CreateCommentDto([Required, StringLength(1000)] string Content);

public record ActivityLogDto(int Id, string Action, DateTime CreatedAt, string Username);

public record TaskDto(
    int Id, string Title, string Description,
    Models.TaskStatus Status, TaskPriority Priority,
    DateTime? DueDate, DateTime CreatedAt,
    int ProjectId, int? AssignedToId,
    List<LabelDto> Labels,
    List<SubTaskDto> SubTasks,
    List<CommentDto> Comments,
    List<ActivityLogDto> ActivityLogs);

public record CreateTaskDto(
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(1000)] string Description,
    TaskPriority Priority,
    DateTime? DueDate,
    int? AssignedToId);

public record UpdateTaskDto(
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(1000)] string Description,
    Models.TaskStatus Status,
    TaskPriority Priority,
    DateTime? DueDate,
    int? AssignedToId);
