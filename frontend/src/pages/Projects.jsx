import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { useNotif } from '../context/NotifContext';


const DUMMY_PROJECTS = [
  {
    id: 'd1', name: 'TaskManager Web App',
    description: 'Full stack task management app built with ASP.NET Core 10 + React 19. My biggest personal project.',
    taskCount: 18, completedCount: 14, inProgressCount: 3,
    createdAt: '2025-01-10', shareToken: null,
  },
  {
    id: 'd2', name: 'LinkedIn Launch & Portfolio',
    description: 'Everything needed to showcase and launch the project publicly — post, demo video, screenshots.',
    taskCount: 8, completedCount: 3, inProgressCount: 3,
    createdAt: '2025-03-01', shareToken: null,
  },
  {
    id: 'd3', name: 'Personal Portfolio Site',
    description: 'Redesigning my portfolio with new projects, skills section and dark mode.',
    taskCount: 7, completedCount: 5, inProgressCount: 1,
    createdAt: '2024-11-20', shareToken: null,
  },
  {
    id: 'd4', name: 'DSA Practice Tracker',
    description: 'Tracking LeetCode and DSA problems by topic — arrays, trees, DP, graphs.',
    taskCount: 6, completedCount: 5, inProgressCount: 1,
    createdAt: '2024-10-05', shareToken: null,
  },
  {
    id: 'd5', name: 'Learning Roadmap 2025',
    description: 'Topics to learn this year: system design, cloud, advanced React patterns.',
    taskCount: 5, completedCount: 3, inProgressCount: 1,
    createdAt: '2025-01-01', shareToken: null,
  },
  {
    id: 'd6', name: 'Side Project Ideas',
    description: 'Backlog of app ideas to explore — SaaS tools, open source contributions, experiments.',
    taskCount: 3, completedCount: 1, inProgressCount: 0,
    createdAt: '2024-12-15', shareToken: null,
  },
];

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return fallback;
};

const LABEL_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#f97316','#ec4899'];
const CARD_ACCENTS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#f97316','#ec4899'];

function NewProjectModal({ onClose, onCreated, push }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/projects', form);
      push('Project created!', 'success');
      onCreated();
      onClose();
    } catch (err) {
      push(extractError(err, 'Failed to create project'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Project</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Project Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus placeholder="e.g. Website Redesign" />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this project about?" />
          </label>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="proj-skeleton" />;
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [labels, setLabels] = useState([]);
  const [labelForm, setLabelForm] = useState({ name: '', color: '#6366f1' });
  const [loading, setLoading] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const navigate = useNavigate();
  const { push } = useNotif();
  const { user } = useAuth();
  const isTestAccount = user?.isAdmin === true;
  const showDummy = isTestAccount && projects.length === 0;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, labelRes] = await Promise.all([api.get('/projects?pageSize=10000'), api.get('/labels')]);
      setProjects(projRes.data.items ?? projRes.data);
      setLabels(labelRes.data);
    } catch (err) {
      push(extractError(err, 'Failed to load data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

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
    <div className="page proj-page">
      <div className="proj-hero">
        <div className="proj-hero-text">
          <h1 className="proj-hero-title">My Projects</h1>
          <p className="proj-hero-sub">{loading ? '…' : `${showDummy ? DUMMY_PROJECTS.length : projects.length} project${(showDummy ? DUMMY_PROJECTS.length : projects.length) !== 1 ? 's' : ''}`}</p>
        </div>
        <div className="proj-hero-actions">
          <button className="btn-outline proj-labels-btn" onClick={() => setShowLabels(s => !s)}>
            🏷️ Labels
            {labels.length > 0 && <span className="proj-labels-count">{labels.length}</span>}
          </button>
          <button className="btn-primary proj-new-btn" onClick={() => setShowNewModal(true)}>+ New Project</button>
        </div>
      </div>

      {showLabels && (
        <div className="proj-labels-drawer">
          <div className="proj-labels-drawer-header">
            <span className="proj-labels-drawer-title">Labels</span>
            <button className="modal-close" onClick={() => setShowLabels(false)}>✕</button>
          </div>
          <div className="proj-labels-chips">
            {labels.length === 0
              ? <span className="proj-labels-empty">No labels yet</span>
              : labels.map(l => (
                <span key={l.id} className="label-chip"
                  style={{ background: l.color + '22', color: l.color, border: `1px solid ${l.color}` }}>
                  {l.name}
                  <button onClick={() => handleDeleteLabel(l.id)}>✕</button>
                </span>
              ))}
          </div>
          <form onSubmit={handleCreateLabel} className="proj-labels-form">
            <input placeholder="Label name" value={labelForm.name}
              onChange={e => setLabelForm({ ...labelForm, name: e.target.value })} required />
            <div className="color-options">
              {LABEL_COLORS.map(c => (
                <div key={c} className={`color-dot${labelForm.color === c ? ' selected' : ''}`}
                  style={{ background: c }} onClick={() => setLabelForm({ ...labelForm, color: c })} />
              ))}
            </div>
            <button type="submit" className="btn-add">+ Add</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="projects-grid">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 && !showDummy ? (
        <div className="proj-empty">
          <div className="proj-empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowNewModal(true)}>+ New Project</button>
        </div>
      ) : (
        <>
          <p className="section-title">{(showDummy ? DUMMY_PROJECTS : projects).length} Project{(showDummy ? DUMMY_PROJECTS : projects).length !== 1 ? 's' : ''}</p>
          <div className="projects-grid">
            {(showDummy ? DUMMY_PROJECTS : projects).map((p, i) => {
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
              const pct = p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
              const isDummy = showDummy;
              return (
                <div key={p.id} className="proj-card">
                  <div className="proj-card-accent" style={{ background: accent }} />
                  <div className="proj-card-body">
                    <div className="proj-card-top">
                      <div className="proj-card-icon" style={{ background: accent + '22', color: accent }}>📁</div>
                      <div className="proj-card-title-wrap">
                        <h3 className="proj-card-name">{p.name}</h3>
                        <span className="proj-card-date">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {p.description && <p className="proj-card-desc">{p.description}</p>}
                    <div className="proj-card-stats">
                      <div className="proj-stat">
                        <span className="proj-stat-value">{p.taskCount ?? 0}</span>
                        <span className="proj-stat-label">Total</span>
                      </div>
                      <div className="proj-stat">
                        <span className="proj-stat-value proj-stat-value--done">{p.completedCount ?? 0}</span>
                        <span className="proj-stat-label">Done</span>
                      </div>
                      <div className="proj-stat">
                        <span className="proj-stat-value proj-stat-value--prog">{p.inProgressCount ?? 0}</span>
                        <span className="proj-stat-label">Active</span>
                      </div>
                      <div className="proj-stat">
                        <span className="proj-stat-value proj-stat-value--pct">{pct}%</span>
                        <span className="proj-stat-label">Done</span>
                      </div>
                    </div>
                    <div className="proj-card-progress-bar">
                      <div className="proj-card-progress-fill" style={{ width: `${pct}%`, background: accent }} />
                    </div>
                    <div className="proj-card-footer">
                      <button className="proj-btn-view" onClick={() => !isDummy && navigate(`/projects/${p.id}`)} style={{ opacity: isDummy ? 0.5 : 1, cursor: isDummy ? 'default' : 'pointer' }}>View Tasks</button>
                      <div className="proj-card-secondary">
                        {!isDummy && (p.shareToken ? (
                          <>
                            <button className="proj-icon-btn proj-icon-btn--share" onClick={() => copyLink(p.shareToken)} title="Copy share link">🔗</button>
                            <button className="proj-icon-btn proj-icon-btn--lock" onClick={() => handleRevoke(p.id)} title="Revoke link">🔒</button>
                          </>
                        ) : (
                          <button className="proj-icon-btn proj-icon-btn--share" onClick={() => handleShare(p.id)} disabled={sharingId === p.id} title="Generate share link">🔗</button>
                        ))}
                        {!isDummy && <button className="proj-icon-btn proj-icon-btn--del" onClick={() => handleDelete(p.id, p.name)} title="Delete project">🗑</button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreated={load}
          push={push}
        />
      )}
    </div>
  );
}
