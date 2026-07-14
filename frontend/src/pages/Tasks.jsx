import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import TaskTemplates from '../components/TaskTemplates';
import TaskEditModal from '../components/TaskEditModal';
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCorners, useDroppable
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/api';
import { useNotif } from '../context/NotifContext';

const STATUSES = ['Todo', 'InProgress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const COL_CLASS = { Todo: 'todo', InProgress: 'inprogress', Done: 'done' };
const COL_LABEL = { Todo: 'To Do', InProgress: 'In Progress', Done: 'Done' };

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return fallback;
};

const getDueBadge = (dueDate, status) => {
  if (!dueDate || status === 'Done') return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = (due - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { label: 'Overdue', cls: 'due-overdue' };
  if (diff <= 3) return { label: 'Due Soon', cls: 'due-soon' };
  return null;
};

function TaskCardInner({ task, projectId, onRefresh, labels, allTasks, isDragging, dragHandleListeners, dragHandleAttributes }) {
  const { push } = useNotif();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const [depTaskId, setDepTaskId] = useState('');

  const safeId = (id) => Number.isInteger(id) && id > 0;

  const startTimer = () => {
    setTimerRunning(true);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopTimer = async () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    if (elapsed <= 0) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/time`, { seconds: elapsed });
      push(`Logged ${formatTime(elapsed)}`, 'success');
      setElapsed(0);
      onRefresh();
    } catch { push('Failed to log time', 'error'); }
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
    return `${sec}s`;
  };

  const handleDelete = async () => {
    if (!safeId(task.id) || !window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      push('Task deleted', 'info');
      onRefresh();
    } catch { push('Failed to delete task', 'error'); }
  };

  const handleArchive = async () => {
    if (!safeId(task.id)) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/archive`);
      push('Task archived', 'info');
      onRefresh();
    } catch { push('Failed to archive task', 'error'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !safeId(task.id)) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: comment });
      setComment('');
      push('Comment added', 'success');
      onRefresh();
    } catch { push('Failed to add comment', 'error'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!safeId(task.id) || !safeId(commentId)) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}/comments/${commentId}`);
      onRefresh();
    } catch { push('Failed to delete comment', 'error'); }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !safeId(task.id)) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/subtasks`, { title: subtaskTitle });
      setSubtaskTitle('');
      onRefresh();
    } catch { push('Failed to add subtask', 'error'); }
  };

  const handleToggleSubtask = async (subtask) => {
    if (!safeId(task.id) || !safeId(subtask.id)) return;
    try {
      await api.put(`/projects/${projectId}/tasks/${task.id}/subtasks/${subtask.id}`,
        { title: subtask.title, isCompleted: !subtask.isCompleted });
      onRefresh();
    } catch { push('Failed to update subtask', 'error'); }
  };

  const handleDeleteSubtask = async (subId) => {
    if (!safeId(task.id) || !safeId(subId)) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}/subtasks/${subId}`);
      onRefresh();
    } catch { push('Failed to delete subtask', 'error'); }
  };

  const handleAddLabel = async (labelId) => {
    if (!safeId(task.id) || !safeId(labelId)) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/labels/${labelId}`);
      onRefresh();
    } catch { push('Failed to add label', 'error'); }
  };

  const handleRemoveLabel = async (labelId) => {
    if (!safeId(task.id) || !safeId(labelId)) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}/labels/${labelId}`);
      onRefresh();
    } catch { push('Failed to remove label', 'error'); }
  };

  const handleAddDep = async (e) => {
    e.preventDefault();
    const blockerId = parseInt(depTaskId, 10);
    if (!blockerId) return;
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/dependencies/${blockerId}`);
      setDepTaskId('');
      push('Dependency added', 'success');
      onRefresh();
    } catch (err) { push(extractError(err, 'Failed to add dependency'), 'error'); }
  };

  const handleRemoveDep = async (blockerId) => {
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}/dependencies/${blockerId}`);
      onRefresh();
    } catch { push('Failed to remove dependency', 'error'); }
  };

  const isBlocked = task.blockedByIds?.some(id => {
    const blocker = allTasks?.find(t => t.id === id);
    return blocker && blocker.status !== 'Done';
  });

  const dueBadge = getDueBadge(task.dueDate, task.status);
  const completedSubs = task.subTasks?.filter(s => s.isCompleted).length ?? 0;
  const totalSubs = task.subTasks?.length ?? 0;

  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className={`task-card${isDragging ? ' task-card--dragging' : ''}`}>
      <div className="task-card-drag-handle" title="Drag to move" {...dragHandleListeners} {...dragHandleAttributes} style={{ cursor: 'grab', touchAction: 'none' }}>⠿</div>
      <div className="task-card-top">
        <strong>{task.title}</strong>
        <div className="task-card-badges">
          <span className={`badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
          {task.recurrence && task.recurrence !== 'None' && (
            <span className="badge-recurrence">
              {task.recurrence === 'Daily' ? '🔁 Daily' : task.recurrence === 'Weekly' ? '🔁 Weekly' : '🔁 Monthly'}
            </span>
          )}
          {isBlocked && <span className="badge-blocked">🚫 Blocked</span>}
          {dueBadge && <span className={`due-badge ${dueBadge.cls}`}>{dueBadge.label}</span>}
        </div>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      {task.dueDate && (
        <small className="task-due">📅 {new Date(task.dueDate).toLocaleDateString()}</small>
      )}

      {task.labels?.length > 0 && (
        <div className="task-labels">
          {task.labels.map(l => (
            <span key={l.id} className="label-chip" style={{ background: l.color + '22', color: l.color, border: `1px solid ${l.color}` }}>
              {l.name}
              <button onClick={() => handleRemoveLabel(l.id)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {totalSubs > 0 && (
        <div className="subtask-progress">
          <div className="subtask-bar">
            <div className="subtask-bar-fill" style={{ width: `${(completedSubs / totalSubs) * 100}%` }} />
          </div>
          <small>{completedSubs}/{totalSubs} subtasks</small>
        </div>
      )}

      {task.comments?.length > 0 && (
        <small className="comment-count">💬 {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</small>
      )}

      <div className="task-timer">
        <span className="timer-total">⏱ {formatTime(task.timeSpentSeconds + (timerRunning ? elapsed : 0))}</span>
        {timerRunning ? (
          <button className="btn-timer btn-timer-stop" onClick={stopTimer}>
            ⏹ Stop {elapsed > 0 && `(+${formatTime(elapsed)})`}
          </button>
        ) : (
          <button className="btn-timer btn-timer-start" onClick={startTimer}>▶ Start</button>
        )}
      </div>

      <div className="task-card-footer">
        <button className="btn-icon" onClick={() => setExpanded(e => !e)} title="Details">
          {expanded ? '▲ Hide' : '▼ Details'}
        </button>
        <button className="btn-icon" onClick={() => setShowEdit(true)} title="Edit task">✏️</button>
        <button className="btn-archive" onClick={handleArchive} title="Archive task">📦</button>
        <button className="btn-delete" onClick={handleDelete}>🗑</button>
      </div>

      {showEdit && (
        <TaskEditModal
          task={task}
          projectId={projectId}
          onClose={() => setShowEdit(false)}
          onSaved={onRefresh}
          push={push}
        />
      )}

      {expanded && (
        <div className="task-expanded">
          {labels.length > 0 && (
            <div className="expanded-section">
              <h4>Add Labels</h4>
              <div className="label-options">
                {labels.filter(l => !task.labels?.find(tl => tl.id === l.id)).map(l => (
                  <span key={l.id} className="label-chip label-chip-add"
                    style={{ background: l.color + '22', color: l.color, border: `1px solid ${l.color}`, cursor: 'pointer' }}
                    onClick={() => handleAddLabel(l.id)}>
                    + {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="expanded-section">
            <h4>🔗 Blocked By</h4>
            {task.blockedByIds?.length > 0 ? (
              task.blockedByIds.map(bid => {
                const blocker = allTasks?.find(t => t.id === bid);
                const done = blocker?.status === 'Done';
                return (
                  <div key={bid} className="dep-item">
                    <span className={`dep-title ${done ? 'dep-done' : 'dep-pending'}`}>
                      {done ? '✅' : '⏳'} {blocker ? blocker.title : `Task #${bid}`}
                    </span>
                    <button className="btn-icon-sm" onClick={() => handleRemoveDep(bid)}>✕</button>
                  </div>
                );
              })
            ) : <p className="dep-empty">No blockers</p>}
            <form onSubmit={handleAddDep} className="mini-form">
              <select value={depTaskId} onChange={e => setDepTaskId(e.target.value)}>
                <option value="">Add blocker...</option>
                {allTasks?.filter(t => t.id !== task.id && !task.blockedByIds?.includes(t.id)).map(t => (
                  <option key={t.id} value={t.id}>#{t.id} {t.title}</option>
                ))}
              </select>
              <button type="submit" className="btn-mini" disabled={!depTaskId}>Add</button>
            </form>
          </div>

          <div className="expanded-section">
            <h4>Subtasks</h4>
            {task.subTasks?.map(s => (
              <div key={s.id} className="subtask-item">
                <input type="checkbox" checked={s.isCompleted} onChange={() => handleToggleSubtask(s)} />
                <span style={{ textDecoration: s.isCompleted ? 'line-through' : 'none', color: s.isCompleted ? '#94a3b8' : 'inherit' }}>
                  {s.title}
                </span>
                <button className="btn-icon-sm" onClick={() => handleDeleteSubtask(s.id)}>✕</button>
              </div>
            ))}
            <form onSubmit={handleAddSubtask} className="mini-form">
              <input placeholder="Add subtask..." value={subtaskTitle}
                onChange={e => setSubtaskTitle(e.target.value)} />
              <button type="submit" className="btn-mini">Add</button>
            </form>
          </div>

          {task.activityLogs?.length > 0 && (
            <div className="expanded-section">
              <h4>Activity</h4>
              <ul className="activity-log">
                {task.activityLogs.map(a => (
                  <li key={a.id} className="activity-item">
                    <span className="activity-dot" />
                    <div className="activity-body">
                      <span className="activity-action">{a.action}</span>
                      <span className="activity-meta">{a.username} · {new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="expanded-section">
            <h4>Comments</h4>
            {task.comments?.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <strong>{c.authorUsername}</strong>
                  <small>{new Date(c.createdAt).toLocaleString()}</small>
                  <button className="btn-icon-sm" onClick={() => handleDeleteComment(c.id)}>✕</button>
                </div>
                <p>{c.content}</p>
              </div>
            ))}
            <form onSubmit={handleAddComment} className="mini-form">
              <input placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)} />
              <button type="submit" className="btn-mini">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableTaskCard({ task, projectId, onRefresh, labels, allTasks }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardInner
        task={task}
        projectId={projectId}
        onRefresh={onRefresh}
        labels={labels}
        allTasks={allTasks}
        isDragging={isDragging}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  );
}

function DroppableColumn({ status, tasks, projectId, onRefresh, labels, allTasks }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <div className={`kanban-col ${COL_CLASS[status]}`}>
      <div className="kanban-col-header">
        <h3>{COL_LABEL[status]}</h3>
        <span className="col-count">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} style={{ minHeight: '60px', flex: 1 }}>
          {tasks.length === 0 ? (
            <div className="empty-col-drop">Drop tasks here</div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} projectId={projectId} onRefresh={onRefresh} labels={labels} allTasks={allTasks} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Tasks() {
  const { projectId } = useParams();
  const safeProjectId = parseInt(projectId, 10);
  const navigate = useNavigate();
  const { push } = useNotif();
  const [tasks, setTasks] = useState([]);
  const [labels, setLabels] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', recurrence: 'None' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [view, setView] = useState('kanban'); // 'kanban' | 'calendar'
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const titleInputRef = useRef();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = useCallback(async () => {
    if (!safeProjectId) return;
    try {
      setLoading(true);
      const [tasksRes, labelsRes] = await Promise.all([
        api.get(`/projects/${safeProjectId}/tasks`),
        api.get('/labels')
      ]);
      setTasks(tasksRes.data.items ?? tasksRes.data);
      setLabels(labelsRes.data);
      setSelectedIds(new Set());
    } catch (err) {
      push(extractError(err, 'Failed to load tasks'), 'error');
    } finally {
      setLoading(false);
    }
  }, [safeProjectId]);

  const loadArchived = useCallback(async () => {
    if (!safeProjectId) return;
    try {
      const res = await api.get(`/projects/${safeProjectId}/tasks/archived`);
      setArchivedTasks(res.data);
    } catch { push('Failed to load archived tasks', 'error'); }
  }, [safeProjectId]);

  const handleRestore = async (taskId) => {
    try {
      await api.post(`/projects/${safeProjectId}/tasks/${taskId}/restore`);
      push('Task restored', 'success');
      load();
      loadArchived();
    } catch { push('Failed to restore task', 'error'); }
  };

  const handleDeleteArchived = async (taskId, title) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;
    try {
      await api.delete(`/projects/${safeProjectId}/tasks/${taskId}`);
      push('Task permanently deleted', 'info');
      loadArchived();
    } catch { push('Failed to delete task', 'error'); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/projects/${safeProjectId}/tasks/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers['content-disposition']?.split('filename=')[1] ?? 'tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
      push('Tasks exported!', 'success');
    } catch { push('Failed to export tasks', 'error'); }
  };

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'n') titleInputRef.current?.focus();
      if (e.key === '?') setShowHelp(s => !s);
      if (e.key === 'Escape') { setShowHelp(false); setSelectedIds(new Set()); }
      if (e.key === 'c') setView(v => v === 'kanban' ? 'calendar' : 'kanban');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleBulkStatus = async (status) => {
    try {
      await Promise.all([...selectedIds].map(id => {
        const task = tasks.find(t => t.id === id);
        if (!task) return Promise.resolve();
        return api.put(`/projects/${safeProjectId}/tasks/${id}`, { ...task, status, dueDate: task.dueDate ?? null, assignedToId: task.assignedToId ?? null });
      }));
      push(`Updated ${selectedIds.size} tasks`, 'success');
      setSelectedIds(new Set());
      load();
    } catch { push('Bulk update failed', 'error'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} tasks?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/projects/${safeProjectId}/tasks/${id}`)));
      push(`Deleted ${selectedIds.size} tasks`, 'info');
      setSelectedIds(new Set());
      load();
    } catch { push('Bulk delete failed', 'error'); }
  };

  const pendingSubtasksRef = useRef([]);

  const applyTemplate = (template) => {
    const subtasks = template.subtaskTitles ? JSON.parse(template.subtaskTitles) : [];
    setForm(f => ({ ...f, title: template.title, description: template.description ?? '', priority: template.priority }));
    pendingSubtasksRef.current = subtasks;
    setShowTemplates(false);
    titleInputRef.current?.focus();
    push(`Template "${template.name}" applied`, 'success');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!safeProjectId) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${safeProjectId}/tasks`, { ...form, dueDate: form.dueDate || null });
      const newTaskId = res.data?.id;
      const pending = pendingSubtasksRef.current;
      if (newTaskId && pending.length > 0) {
        await Promise.all(pending.map(title => api.post(`/projects/${safeProjectId}/tasks/${newTaskId}/subtasks`, { title })));
        pendingSubtasksRef.current = [];
      }
      setForm({ title: '', description: '', priority: 'Medium', dueDate: '', recurrence: 'None' });
      push('Task created!', 'success');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to create task'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragStart = ({ active }) => {
    const task = tasks.find(t => `task-${t.id}` === active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const taskId = parseInt(active.id.toString().replace('task-', ''), 10);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target status — over could be a column id or another task id
    let newStatus = null;
    if (STATUSES.includes(over.id)) {
      newStatus = over.id;
    } else {
      const overId = parseInt(over.id.toString().replace('task-', ''), 10);
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus || newStatus === task.status) return;

    // Block moving to Done if task has unresolved blockers
    if (newStatus === 'Done') {
      const isBlocked = task.blockedByIds?.some(id => {
        const blocker = tasks.find(t => t.id === id);
        return blocker && blocker.status !== 'Done';
      });
      if (isBlocked) {
        push('Cannot mark as Done — task has unresolved blockers', 'error');
        return;
      }
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/projects/${safeProjectId}/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        assignedToId: task.assignedToId ?? null,
        recurrence: task.recurrence
      });
      push(`Moved to ${COL_LABEL[newStatus]}`, 'success');
    } catch {
      push('Failed to move task', 'error');
      load(); // revert on failure
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(t => t.status === s);
    return acc;
  }, {});

  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/projects')}>← Back</button>
        <h2>Tasks</h2>
        {overdueCount > 0 && (
          <span className="overdue-banner">🚨 {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</span>
        )}
        <div className="tasks-view-toggle">
          <button className={`view-btn${view === 'kanban' ? ' view-btn--active' : ''}`} onClick={() => setView('kanban')}>⬛ Kanban</button>
          <button className={`view-btn${view === 'calendar' ? ' view-btn--active' : ''}`} onClick={() => setView('calendar')}>📅 Calendar</button>
        </div>
        <button className="btn-outline" onClick={() => setShowTemplates(s => !s)}>📋 Templates</button>
        <button className="btn-outline" style={{ marginLeft: 'auto' }} onClick={() => { setShowArchived(s => !s); if (!showArchived) loadArchived(); }}>
          📦 {showArchived ? 'Hide Archived' : 'View Archived'}
        </button>
        <button className="btn-outline btn-export" onClick={handleExport}>⬇️ Export CSV</button>
        <button className="btn-outline" onClick={() => setShowHelp(true)} title="Keyboard shortcuts">⌨️</button>
      </div>

      {showTemplates && <TaskTemplates onApply={applyTemplate} />}

      <form onSubmit={handleCreate} className="add-form">
        <input ref={titleInputRef} placeholder="Task title (press N)" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
          <option value="None">No Repeat</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
        <button type="submit" className="btn-add" disabled={submitting}>
          {submitting ? 'Adding...' : '+ Add Task'}
        </button>
      </form>

      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search tasks..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{COL_LABEL[s]}</option>)}
        </select>
        {(search || filterPriority || filterStatus) && (
          <button className="btn-clear" onClick={() => { setSearch(''); setFilterPriority(''); setFilterStatus(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <button className="btn-mini" onClick={() => handleBulkStatus('Todo')}>Move to Todo</button>
          <button className="btn-mini" onClick={() => handleBulkStatus('InProgress')}>Move to In Progress</button>
          <button className="btn-mini" onClick={() => handleBulkStatus('Done')}>Mark Done</button>
          <button className="btn-mini btn-mini--danger" onClick={handleBulkDelete}>Delete</button>
          <button className="btn-outline" onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading tasks...</p>
      ) : view === 'calendar' ? (
        <CalendarView tasks={tasks} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban">
            {STATUSES.map(status => (
              <DroppableColumn
                key={status}
                status={status}
                tasks={grouped[status]}
                projectId={safeProjectId}
                onRefresh={load}
                labels={labels}
                allTasks={tasks}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCardInner task={activeTask} projectId={safeProjectId} onRefresh={load} labels={labels} allTasks={tasks} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="modal-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="shortcuts-list">
              {[['N','Focus new task input'],['C','Toggle Calendar / Kanban view'],['?','Show this help'],['Esc','Close modals / clear selection']].map(([key, desc]) => (
                <div key={key} className="shortcut-item">
                  <kbd className="shortcut-key">{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showArchived && (
        <div className="archived-panel">
          <h3>📦 Archived Tasks ({archivedTasks.length})</h3>
          {archivedTasks.length === 0 ? (
            <p className="empty-col">No archived tasks</p>
          ) : (
            archivedTasks.map(t => (
              <div key={t.id} className="archived-item">
                <div className="archived-item-info">
                  <span className="archived-item-title">{t.title}</span>
                  <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                  <small>Archived {new Date(t.archivedAt).toLocaleDateString()}</small>
                </div>
                <div className="archived-item-actions">
                  <button className="btn-mini" onClick={() => handleRestore(t.id)}>↩ Restore</button>
                  <button className="btn-delete" onClick={() => handleDeleteArchived(t.id, t.title)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
