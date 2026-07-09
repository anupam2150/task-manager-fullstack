import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function TaskCard({ task, projectId, onRefresh, labels }) {
  const { push } = useNotif();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const safeId = (id) => Number.isInteger(id) && id > 0;

  const handleStatusChange = async (status) => {
    if (!safeId(task.id)) return;
    try {
      await api.put(`/projects/${projectId}/tasks/${task.id}`, { ...task, status });
      push(`Task moved to ${COL_LABEL[status]}`, 'success');
      onRefresh();
    } catch { push('Failed to update status', 'error'); }
  };

  const handleDelete = async () => {
    if (!safeId(task.id) || !window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      push('Task deleted', 'info');
      onRefresh();
    } catch { push('Failed to delete task', 'error'); }
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

  const dueBadge = getDueBadge(task.dueDate, task.status);
  const completedSubs = task.subTasks?.filter(s => s.isCompleted).length ?? 0;
  const totalSubs = task.subTasks?.length ?? 0;

  return (
    <div className="task-card">
      <div className="task-card-top">
        <strong>{task.title}</strong>
        <div className="task-card-badges">
          <span className={`badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
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

      <div className="task-card-footer">
        <select value={task.status} onChange={e => handleStatusChange(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{COL_LABEL[s]}</option>)}
        </select>
        <button className="btn-icon" onClick={() => setExpanded(e => !e)} title="Details">
          {expanded ? '▲' : '▼'}
        </button>
        <button className="btn-delete" onClick={handleDelete}>🗑</button>
      </div>

      {expanded && (
        <div className="task-expanded">
          {/* Labels */}
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

          {/* Subtasks */}
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

          {/* Comments */}
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

export default function Tasks() {
  const { projectId } = useParams();
  const safeProjectId = parseInt(projectId, 10);
  const navigate = useNavigate();
  const { push } = useNotif();
  const [tasks, setTasks] = useState([]);
  const [labels, setLabels] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    } catch (err) {
      push(extractError(err, 'Failed to load tasks'), 'error');
    } finally {
      setLoading(false);
    }
  }, [safeProjectId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!safeProjectId) return;
    try {
      setSubmitting(true);
      await api.post(`/projects/${safeProjectId}/tasks`, { ...form, dueDate: form.dueDate || null });
      setForm({ title: '', description: '', priority: 'Medium', dueDate: '' });
      push('Task created!', 'success');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to create task'), 'error');
    } finally {
      setSubmitting(false);
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
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h2>Tasks</h2>
        {overdueCount > 0 && (
          <span className="overdue-banner">🚨 {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <form onSubmit={handleCreate} className="add-form">
        <input placeholder="Task title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
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

      {loading ? (
        <p className="loading">Loading tasks...</p>
      ) : (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className={`kanban-col ${COL_CLASS[status]}`}>
              <div className="kanban-col-header">
                <h3>{COL_LABEL[status]}</h3>
                <span className="col-count">{grouped[status].length}</span>
              </div>
              {grouped[status].length === 0 ? (
                <p className="empty-col">No tasks here</p>
              ) : (
                grouped[status].map(task => (
                  <TaskCard key={task.id} task={task} projectId={safeProjectId} onRefresh={load} labels={labels} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
