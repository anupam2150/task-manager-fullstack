using Microsoft.EntityFrameworkCore;
using TaskManager.API.Models;

namespace TaskManager.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<SubTask> SubTasks => Set<SubTask>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<TaskLabel> TaskLabels => Set<TaskLabel>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<TaskTemplate> TaskTemplates => Set<TaskTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>()
            .HasOne(p => p.Owner)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedTo)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Task)
            .WithMany(t => t.Comments)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Author)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SubTask>()
            .HasOne(s => s.Task)
            .WithMany(t => t.SubTasks)
            .HasForeignKey(s => s.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Label>()
            .HasOne(l => l.Owner)
            .WithMany(u => u.Labels)
            .HasForeignKey(l => l.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskLabel>()
            .HasKey(tl => new { tl.TaskId, tl.LabelId });

        modelBuilder.Entity<TaskLabel>()
            .HasOne(tl => tl.Task)
            .WithMany(t => t.TaskLabels)
            .HasForeignKey(tl => tl.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskLabel>()
            .HasOne(tl => tl.Label)
            .WithMany(l => l.TaskLabels)
            .HasForeignKey(tl => tl.LabelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.Task)
            .WithMany(t => t.ActivityLogs)
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskDependency>()
            .HasKey(d => new { d.BlockerId, d.BlockedId });

        modelBuilder.Entity<TaskDependency>()
            .HasOne(d => d.Blocker)
            .WithMany(t => t.Blocking)
            .HasForeignKey(d => d.BlockerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskDependency>()
            .HasOne(d => d.Blocked)
            .WithMany(t => t.BlockedBy)
            .HasForeignKey(d => d.BlockedId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskTemplate>()
            .HasOne(t => t.Owner)
            .WithMany()
            .HasForeignKey(t => t.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
