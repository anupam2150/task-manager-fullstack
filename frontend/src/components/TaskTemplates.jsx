import { useEffect, useState } from 'react';
import api from '../api/api';
import { useNotif } from '../context/NotifContext';

export default function TaskTemplates({ onApply }) {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'General', title: '', description: '', priority: 'Medium', subtasks: '' });
  const { push } = useNotif();

  useEffect(() => {
    api.get('/templates').then(({ data }) => setTemplates(data)).catch(() => {});
  }, []);

  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/templates', {
        name: form.name, category: form.category, title: form.title,
        description: form.description, priority: form.priority,
        subtaskTitles: form.subtasks ? JSON.stringify(form.subtasks.split('\n').filter(Boolean)) : null,
      });
      setTemplates(t => [...t, data]);
      setForm({ name: '', category: 'General', title: '', description: '', priority: 'Medium', subtasks: '' });
      setShowCreate(false);
      push('Template created!', 'success');
    } catch { push('Failed to create template', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(t => t.filter(x => x.id !== id));
      push('Template deleted', 'info');
    } catch { push('Failed to delete template', 'error'); }
  };

  return (
    <div className="templates-panel">
      <div className="templates-header">
        <span className="templates-title">📋 Task Templates</span>
        <button className="btn-mini" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="template-create-form">
          <input placeholder="Template name (e.g. Sprint Task)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Default task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>General</option><option>Dev</option><option>Design</option><option>Marketing</option>
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <textarea placeholder="Default description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          <textarea placeholder="Subtasks (one per line, optional)" value={form.subtasks} onChange={e => setForm({ ...form, subtasks: e.target.value })} rows={2} />
          <button type="submit" className="btn-mini">Save Template</button>
        </form>
      )}

      <div className="templates-list">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="template-group">
            <div className="template-group-label">{cat}</div>
            {items.map(t => (
              <div key={t.id} className="template-item">
                <div className="template-item-info">
                  <span className="template-item-name">{t.name}</span>
                  <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                </div>
                <div className="template-item-actions">
                  <button className="btn-mini" onClick={() => onApply(t)}>Use</button>
                  {!t.isSystem && (
                    <button className="btn-icon-sm" onClick={() => handleDelete(t.id)}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
