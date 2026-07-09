import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useNotif } from '../context/NotifContext';

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return fallback;
};

const LABEL_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#f97316','#ec4899'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [labels, setLabels] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [labelForm, setLabelForm] = useState({ name: '', color: '#6366f1' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const navigate = useNavigate();
  const { push } = useNotif();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, labelRes] = await Promise.all([api.get('/projects'), api.get('/labels')]);
      setProjects(projRes.data.items ?? projRes.data);
      setLabels(labelRes.data);
    } catch (err) {
      push(extractError(err, 'Failed to load data'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      push('Project created!', 'success');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to create project'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will also delete all its tasks.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      push('Project deleted', 'info');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to delete project'), 'error');
    }
  };

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/labels', labelForm);
      setLabelForm({ name: '', color: '#6366f1' });
      push('Label created!', 'success');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to create label'), 'error');
    }
  };

  const handleDeleteLabel = async (id) => {
    try {
      await api.delete(`/labels/${id}`);
      push('Label deleted', 'info');
      load();
    } catch (err) {
      push(extractError(err, 'Failed to delete label'), 'error');
    }
  };

  const handleShare = async (id) => {
    try {
      setSharingId(id);
      await api.post(`/projects/${id}/share`);
      push('Share link generated!', 'success');
      load();
    } catch { push('Failed to generate share link', 'error'); }
    finally { setSharingId(null); }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke share link? Anyone with the link will lose access.')) return;
    try {
      await api.delete(`/projects/${id}/share`);
      push('Share link revoked', 'info');
      load();
    } catch { push('Failed to revoke share link', 'error'); }
  };

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    push('Link copied to clipboard!', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Projects</h2>
        <button className="btn-outline" onClick={() => setShowLabels(s => !s)}>
          🏷️ {showLabels ? 'Hide Labels' : 'Manage Labels'}
        </button>
      </div>

      {showLabels && (
        <div className="labels-panel">
          <h3>Labels</h3>
          <div className="labels-list">
            {labels.map(l => (
              <span key={l.id} className="label-chip"
                style={{ background: l.color + '22', color: l.color, border: `1px solid ${l.color}` }}>
                {l.name}
                <button onClick={() => handleDeleteLabel(l.id)}>✕</button>
              </span>
            ))}
          </div>
          <form onSubmit={handleCreateLabel} className="add-form" style={{ marginTop: '0.75rem' }}>
            <input placeholder="Label name" value={labelForm.name}
              onChange={e => setLabelForm({ ...labelForm, name: e.target.value })} required />
            <div className="color-options">
              {LABEL_COLORS.map(c => (
                <div key={c} className={`color-dot ${labelForm.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setLabelForm({ ...labelForm, color: c })} />
              ))}
            </div>
            <button type="submit" className="btn-add">+ Add Label</button>
          </form>
        </div>
      )}

      <form onSubmit={handleCreate} className="add-form">
        <input placeholder="Project name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description (optional)" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <button type="submit" className="btn-add" disabled={submitting}>
          {submitting ? 'Creating...' : '+ New Project'}
        </button>
      </form>

      {loading ? (
        <p className="loading">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project using the form above!</p>
        </div>
      ) : (
        <>
          <p className="section-title">{projects.length} Project{projects.length !== 1 ? 's' : ''}</p>
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card">
                <div className="project-card-icon">📁</div>
                <h3>{p.name}</h3>
                <p>{p.description || 'No description provided.'}</p>
                <div className="project-progress">
                  <div className="project-progress-bar">
                    <div
                      className="project-progress-fill"
                      style={{ width: `${p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0}%` }}
                    />
                  </div>
                  <small className="project-progress-label">
                    {p.taskCount === 0 ? 'No tasks yet' : `${p.completedCount}/${p.taskCount} done · ${Math.round((p.completedCount / p.taskCount) * 100)}%`}
                  </small>
                </div>
                <span className="project-card-date">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                <div className="project-card-actions">
                  <button className="btn-view" onClick={() => navigate(`/projects/${p.id}`)}>View Tasks</button>
                  {p.shareToken ? (
                    <>
                      <button className="btn-share-copy" onClick={() => copyLink(p.shareToken)} title="Copy share link">🔗</button>
                      <button className="btn-delete" onClick={() => handleRevoke(p.id)} title="Revoke link">🔒</button>
                    </>
                  ) : (
                    <button className="btn-share" onClick={() => handleShare(p.id)} disabled={sharingId === p.id} title="Generate share link">🔗</button>
                  )}
                  <button className="btn-delete" onClick={() => handleDelete(p.id, p.name)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
