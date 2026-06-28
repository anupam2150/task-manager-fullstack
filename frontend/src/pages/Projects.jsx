import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return fallback;
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects');
      setProjects(data.items ?? data);
    } catch (err) {
      setError(extractError(err, 'Failed to load projects. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to create project. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all its tasks.`)) return;
    try {
      setError('');
      await api.delete(`/projects/${id}`);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete project. Please try again.'));
    }
  };

  return (
    <div className="page">
      <h2>My Projects</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleCreate} className="inline-form">
        <input placeholder="Project name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Project'}
        </button>
      </form>

      {loading ? (
        <p className="loading">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first project above!</p>
        </div>
      ) : (
        <ul className="card-list">
          {projects.map(p => (
            <li key={p.id} className="card">
              <div>
                <strong>{p.name}</strong>
                <p>{p.description}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => navigate(`/projects/${p.id}`)}>View Tasks</button>
                <button className="danger" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
