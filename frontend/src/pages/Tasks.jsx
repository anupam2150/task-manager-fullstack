import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

const STATUSES = ['Todo', 'InProgress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return fallback;
};

export default function Tasks() {
  const { projectId } = useParams();
  const safeProjectId = parseInt(projectId, 10);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!safeProjectId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${safeProjectId}/tasks`);
      setTasks(data.items ?? data);
    } catch (err) {
      setError(extractError(err, 'Failed to load tasks. Please try again.'));
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
      setError('');
      await api.post(`/projects/${safeProjectId}/tasks`, {
        ...form,
        dueDate: form.dueDate || null,
      });
      setForm({ title: '', description: '', priority: 'Medium', dueDate: '' });
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to create task. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (!safeProjectId) return;
    try {
      setError('');
      await api.put(`/projects/${safeProjectId}/tasks/${task.id}`, { ...task, status });
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to update task status. Please try again.'));
    }
  };

  const handleDelete = async (id, title) => {
    if (!safeProjectId) return;
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      setError('');
      await api.delete(`/projects/${safeProjectId}/tasks/${id}`);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete task. Please try again.'));
    }
  };

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="page">
      <h2>Tasks</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleCreate} className="inline-form">
        <input placeholder="Task title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {loading ? (
        <p className="loading">Loading tasks...</p>
      ) : (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <h3>{status} <span className="count">({grouped[status].length})</span></h3>
              {grouped[status].length === 0 ? (
                <p className="empty-col">No tasks here</p>
              ) : (
                grouped[status].map(task => (
                  <div key={task.id} className="task-card">
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    {task.dueDate && <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>}
                    <div className="card-actions">
                      <select value={task.status} onChange={e => handleStatusChange(task, e.target.value)}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button className="danger" onClick={() => handleDelete(task.id, task.title)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
