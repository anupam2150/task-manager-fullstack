using Microsoft.EntityFrameworkCore;
using TaskManager.API.Data;
using TaskManager.API.Models;

namespace TaskManager.API.Services;

public class RecurringTaskService(IServiceScopeFactory scopeFactory, ILogger<RecurringTaskService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await SpawnRecurringTasks();
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task SpawnRecurringTasks()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var candidates = await db.Tasks
            .Where(t => t.Recurrence != RecurrenceType.None
                     && t.Status == Models.TaskStatus.Done
                     && !t.RecurrenceSpawned
                     && !t.IsArchived)
            .ToListAsync();

        foreach (var task in candidates)
        {
            var nextDue = task.DueDate.HasValue
                ? NextDueDate(task.DueDate.Value, task.Recurrence)
                : NextDueDate(DateTime.UtcNow, task.Recurrence);

            db.Tasks.Add(new TaskItem
            {
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                DueDate = nextDue,
                ProjectId = task.ProjectId,
                AssignedToId = task.AssignedToId,
                Recurrence = task.Recurrence
            });

            task.RecurrenceSpawned = true;
            logger.LogInformation("Spawned recurring task '{Title}' due {Due}", task.Title, nextDue);
        }

        if (candidates.Count > 0)
            await db.SaveChangesAsync();
    }

    private static DateTime NextDueDate(DateTime from, RecurrenceType recurrence) => recurrence switch
    {
        RecurrenceType.Daily   => from.AddDays(1),
        RecurrenceType.Weekly  => from.AddDays(7),
        RecurrenceType.Monthly => from.AddMonths(1),
        _                      => from.AddDays(1)
    };
}
