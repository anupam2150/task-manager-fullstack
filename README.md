# TaskManager — Full Stack .NET + React App

A full stack task management application built with ASP.NET Core 10 Web API and React 19.

## Features

### Tasks & Projects
- **Projects** — Create, update, delete projects with progress tracking and completion percentage
- **Kanban Board** — Drag & drop tasks across Todo / In Progress / Done columns
- **Task Priorities & Due Dates** — Low / Medium / High with overdue/due-soon indicators
- **Task Dependencies** — Mark tasks as blocked-by other tasks; blocks moving to Done until resolved
- **Subtasks** — Checklist items per task with progress bar
- **Labels** — Color-coded labels assignable to tasks
- **Comments** — Per-task comment thread
- **Task Activity Log** — Automatic timeline of all changes per task
- **Time Tracking** — Start/stop timer per task, logs cumulative time spent
- **Task Archiving** — Archive and restore tasks, with a dedicated archived panel
- **Recurring Tasks** — Daily / Weekly / Monthly auto-spawn via background service
- **Task Templates** — Save and reuse task templates with pre-filled subtasks
- **Bulk Actions** — Select multiple tasks to move status or delete at once
- **CSV Export** — Download all tasks for a project as a CSV file

### Navigation & UX
- **Dashboard** — Stats overview, completion ring, bar chart, recent tasks, highlights panel
- **Navbar Search** — Live project search with dropdown results
- **Notifications** — Bell icon with overdue/due-soon alerts, mark-read, dismiss
- **Calendar View** — Monthly calendar showing tasks by due date
- **Keyboard Shortcuts** — `N` focus input, `C` toggle calendar, `?` help, `Esc` close
- **Onboarding Tour** — First-time user walkthrough
- **System Theme** — Auto dark/light mode from OS preference with manual toggle, persisted to localStorage
- **Responsive Design** — Fully mobile-friendly across all screen sizes

### Auth & Sharing
- **Authentication** — Register and login with JWT, parsed client-side for role info
- **Public Project Sharing** — Generate a read-only shareable link per project
- **Profile Page** — Update display name, email, upload avatar image
- **Admin Role** — `IsAdmin` flag on users; admin-only account creation endpoint

## Tech Stack

**Backend**
- ASP.NET Core 10 Web API
- Entity Framework Core 10 with SQLite
- JWT Bearer authentication
- BCrypt password hashing
- Hosted background service for recurring tasks

**Frontend**
- React 19 + Vite
- React Router DOM
- Axios
- @dnd-kit/core + @dnd-kit/sortable (drag & drop)

## Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org)

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend/TaskManager.API
   ```

2. Set the required environment variable for JWT:
   ```bash
   # Windows
   set JWT__Key=your-secret-key-min-32-characters-long

   # macOS/Linux
   export JWT__Key=your-secret-key-min-32-characters-long
   ```

3. Apply database migrations:
   ```bash
   dotnet tool run dotnet-ef -- database update
   ```

4. Run the API:
   ```bash
   dotnet run
   ```

API runs at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

App runs at `http://localhost:5173`

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| POST | `/api/auth/admin/create-account` | Create account (admin only) | Yes (Admin) |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | Get all projects (paginated) | Yes |
| POST | `/api/projects` | Create a project | Yes |
| PUT | `/api/projects/{id}` | Update a project | Yes |
| DELETE | `/api/projects/{id}` | Delete a project | Yes |
| POST | `/api/projects/{id}/share` | Generate a public share token | Yes |
| DELETE | `/api/projects/{id}/share` | Revoke the share token | Yes |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/{id}/tasks` | Get tasks (paginated) | Yes |
| POST | `/api/projects/{id}/tasks` | Create a task | Yes |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Update a task | Yes |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Delete a task | Yes |
| GET | `/api/projects/{id}/tasks/export` | Export tasks as CSV | Yes |
| GET | `/api/projects/{id}/tasks/archived` | Get archived tasks | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/archive` | Archive a task | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/restore` | Restore an archived task | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/time` | Log time spent | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/dependencies/{blockerId}` | Add a blocker dependency | Yes |
| DELETE | `/api/projects/{id}/tasks/{taskId}/dependencies/{blockerId}` | Remove a blocker dependency | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/labels/{labelId}` | Add a label to a task | Yes |
| DELETE | `/api/projects/{id}/tasks/{taskId}/labels/{labelId}` | Remove a label from a task | Yes |
| GET | `/api/projects/{id}/tasks/{taskId}/subtasks` | Get subtasks | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/subtasks` | Add a subtask | Yes |
| PUT | `/api/projects/{id}/tasks/{taskId}/subtasks/{subId}` | Update a subtask | Yes |
| DELETE | `/api/projects/{id}/tasks/{taskId}/subtasks/{subId}` | Delete a subtask | Yes |
| GET | `/api/projects/{id}/tasks/{taskId}/comments` | Get comments | Yes |
| POST | `/api/projects/{id}/tasks/{taskId}/comments` | Add a comment | Yes |
| DELETE | `/api/projects/{id}/tasks/{taskId}/comments/{commentId}` | Delete a comment | Yes |

### Labels
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/labels` | Get all labels | Yes |
| POST | `/api/labels` | Create a label | Yes |
| DELETE | `/api/labels/{id}` | Delete a label | Yes |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get notifications | Yes |
| POST | `/api/notifications/generate` | Generate overdue/due-soon notifications | Yes |
| POST | `/api/notifications/mark-read` | Mark all notifications as read | Yes |
| DELETE | `/api/notifications/{id}` | Dismiss a notification | Yes |

### Task Templates
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasktemplates` | Get all templates | Yes |
| POST | `/api/tasktemplates` | Create a template | Yes |
| DELETE | `/api/tasktemplates/{id}` | Delete a template | Yes |

### Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile` | Get profile info | Yes |
| PUT | `/api/profile` | Update display name / email | Yes |
| POST | `/api/profile/avatar` | Upload avatar image | Yes |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get stats and recent tasks | Yes |

### Public
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/public/projects/{token}` | View a shared project (read-only) | No |

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `InitialCreate` | Users, Projects, Tasks |
| `AddLabelsCommentsSubtasks` | Labels, Comments, SubTasks, TaskLabels |
| `AddActivityLog` | ActivityLog model |
| `AddTimeTracking` | TimeSpentSeconds on TaskItem |
| `AddTaskArchiving` | IsArchived, ArchivedAt on TaskItem |
| `AddRecurringTasks` | RecurrenceType, RecurrenceSpawned on TaskItem |
| `AddProjectShareToken` | ShareToken on Project |
| `AddTaskDependencies` | TaskDependencies join table |
| `AddNotificationsProfileTemplates` | Notifications, UserProfile, TaskTemplates |
| `AddIsAdminToUser` | IsAdmin flag on Users |

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## Security

- JWT tokens expire after 7 days, include `isAdmin` claim
- Auth endpoints rate limited to 5 requests/minute
- Global API rate limit of 100 requests/minute
- Passwords hashed with BCrypt
- HTTPS redirect enforced
- Security headers on all responses: CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy
- `[Consumes("application/json")]` / `[Consumes("multipart/form-data")]` on all mutating endpoints (CSRF mitigation)
- Input validation on all endpoints
- Path traversal protection on file uploads
- Reserved usernames (`admin`, `demo`, `testuser`, `anupam`, `snivo`) blocked on public registration
- Configurable CORS via `AllowedOrigins` in `appsettings.json`

## Production Deployment Checklist

- [ ] Set `JWT__Key` environment variable (32+ character secret)
- [ ] Update `AllowedOrigins` in `appsettings.json` to your actual domain
- [ ] Switch SQLite to a production database (PostgreSQL / SQL Server)
- [ ] Set up HTTPS with a valid certificate
- [ ] Configure a reverse proxy (nginx / Caddy)
