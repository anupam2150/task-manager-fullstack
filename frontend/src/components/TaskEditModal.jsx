import { useState } from 'react';
import api from '../api/api';

export default function TaskEditModal({ task, projectId, onClose, onSaved, push }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    recurrence: task.recurrence ?? 'None',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/projects/${projectId}/tasks/${task.id}`, {
        title: form.title,
        description: form.description,
        status: task.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedToId: task.assignedToId ?? null,
        recurrence: form.recurrence,
      });
      push('Task updated!', 'success');
      onSaved();
      onClose();
    } catch { push('Failed to update task', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Task</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </label>
          <div className="modal-row">
            <label>
              Priority
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              Due Date
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </label>
          </div>
          <label>
            Recurrence
            <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
              <option value="None">No Repeat</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </label>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
