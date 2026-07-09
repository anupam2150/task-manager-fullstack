import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const COLS = [
  { key: 'Todo', label: 'To Do', cls: 'todo' },
  { key: 'InProgress', label: 'In Progress', cls: 'inprogress' },
  { key: 'Done', label: 'Done', cls: 'done' },
];

export default function PublicProject() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/public/projects/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }, [token]);

  if (error) return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#f1f5f9' }}>Link not found or revoked</h2>
      </div>
    </div>
  );

  if (!data) return <div className="page"><p className="loading">Loading shared project...</p></div>;

  const byStatus = (status) => data.tasks.filter(t => t.status === status);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>📋 {data.name}</h2>
          {data.description && <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{data.description}</p>}
        </div>
        <span className="badge medium" style={{ marginLeft: 'auto' }}>Read-only</span>
      </div>

      <div className="kanban">
        {COLS.map(col => (
          <div key={col.key} className={`kanban-col ${col.cls}`}>
            <div className="kanban-col-header">
              <h3>{col.label}</h3>
              <span className="col-count">{byStatus(col.key).length}</span>
            </div>
            {byStatus(col.key).length === 0
              ? <p className="empty-col">No tasks</p>
              : byStatus(col.key).map(t => (
                <div key={t.id} className="task-card">
                  <strong>{t.title}</strong>
                  {t.description && <p>{t.description}</p>}
                  <div className="task-card-footer">
                    <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    {t.dueDate && <small>Due {new Date(t.dueDate).toLocaleDateString()}</small>}
                  </div>
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  );
}
