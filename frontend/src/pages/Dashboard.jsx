import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const DUMMY_STATS = {
  totalProjects: 6, totalTasks: 47, done: 31, inProgress: 9,
  todo: 7, overdue: 2, dueSoon: 4, highPriority: 8, completionRate: 66,
  recentTasks: [
    { id: 1, title: 'Deploy backend to Railway', status: 'Done', priority: 'High', projectId: 1 },
    { id: 2, title: 'Implement JWT refresh token', status: 'Done', priority: 'High', projectId: 1 },
    { id: 3, title: 'Build Kanban drag & drop', status: 'Done', priority: 'High', projectId: 1 },
    { id: 4, title: 'Add CSV export feature', status: 'Done', priority: 'Medium', projectId: 1 },
    { id: 5, title: 'Write LinkedIn post for launch', status: 'InProgress', priority: 'High', projectId: 2 },
    { id: 6, title: 'Record demo video', status: 'InProgress', priority: 'Medium', projectId: 2 },
    { id: 7, title: 'Polish dashboard UI', status: 'InProgress', priority: 'Medium', projectId: 1 },
    { id: 8, title: 'Add recurring tasks support', status: 'Done', priority: 'High', projectId: 1 },
    { id: 9, title: 'Set up custom domain', status: 'Todo', priority: 'Low', projectId: 3 },
    { id: 10, title: 'Add README screenshots', status: 'Todo', priority: 'Low', projectId: 2 },
  ],
};

const STAT_CONFIG = [
  { key: 'totalProjects', label: 'Projects',     icon: '📁', color: '#6366f1', bg: '#eef2ff' },
  { key: 'totalTasks',    label: 'Total Tasks',  icon: '📋', color: '#0ea5e9', bg: '#e0f2fe' },
  { key: 'done',          label: 'Completed',    icon: '✅', color: '#10b981', bg: '#d1fae5' },
  { key: 'inProgress',    label: 'In Progress',  icon: '⚡', color: '#f59e0b', bg: '#fef3c7' },
  { key: 'todo',          label: 'To Do',        icon: '📝', color: '#8b5cf6', bg: '#ede9fe' },
  { key: 'overdue',       label: 'Overdue',      icon: '🚨', color: '#ef4444', bg: '#fee2e2' },
  { key: 'dueSoon',       label: 'Due Soon',     icon: '⏰', color: '#f97316', bg: '#ffedd5' },
  { key: 'highPriority',  label: 'High Priority',icon: '🔥', color: '#ec4899', bg: '#fce7f3' },
];

function StatCard({ cfg, value, dummy }) {
  return (
    <div className="db-stat-card" style={{ '--accent': cfg.color, '--accent-bg': cfg.bg }}>
      <div className="db-stat-icon">{cfg.icon}</div>
      <div className="db-stat-value">{value}</div>
      <div className="db-stat-label">{cfg.label}</div>
      <div className="db-stat-bar-wrap">
        <div className="db-stat-bar" style={{ width: dummy ? '60%' : '100%' }} />
      </div>
    </div>
  );
}

function MiniBarChart({ done, inProgress, todo, dummy }) {
  const total = done + inProgress + todo || 1;
  const bars = [
    { label: 'Done',        value: done,       color: '#10b981' },
    { label: 'In Progress', value: inProgress, color: '#f59e0b' },
    { label: 'To Do',       value: todo,       color: '#6366f1' },
  ];
  return (
    <div className="db-chart">
      <div className="db-chart-bars">
        {bars.map(b => (
          <div key={b.label} className="db-chart-bar-wrap">
            <div className="db-chart-bar-track">
              <div
                className="db-chart-bar-fill"
                style={{ height: `${(b.value / total) * 100}%`, background: b.color }}
              />
            </div>
            <span className="db-chart-bar-val">{b.value}</span>
            <span className="db-chart-bar-label">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => { setLoading(false); setError(true); });
  }, []);

  const isTestAccount = user?.isAdmin === true;
  const isEmpty = stats?.totalTasks === 0;
  const dummy = isEmpty && isTestAccount;
  const data = dummy ? DUMMY_STATS : (stats ?? DUMMY_STATS);

  if (loading) return (
    <div className="page">
      <div className="db-skeleton-hero" />
      <div className="db-skeleton-grid">
        {Array(8).fill(0).map((_, i) => <div key={i} className="db-skeleton-card" />)}
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="page db-page">
      <div className="db-empty-hint">
        <div className="db-empty-hint-icon">⚠️</div>
        <p>Failed to load dashboard. Please refresh the page.</p>
      </div>
    </div>
  );

  if (isEmpty && !isTestAccount) return (
    <div className="page db-page">
      <div className="db-hero">
        <div className="db-hero-left">
          <p className="db-hero-greeting">Good {getTimeOfDay()}, {user?.username} 👋</p>
          <h1 className="db-hero-title">Welcome to TaskManager</h1>
          <p className="db-hero-sub">Your dashboard is empty. Create a project and add some tasks to see your stats here.</p>
          <div className="db-hero-actions">
            <button className="btn-primary db-hero-btn" onClick={() => navigate('/projects')}>🚀 Create First Project</button>
          </div>
        </div>
        <div className="db-hero-right">
          <div className="db-completion-ring">
            <svg viewBox="0 0 120 120" className="db-ring-svg">
              <circle cx="60" cy="60" r="50" className="db-ring-track" />
            </svg>
            <div className="db-ring-label">
              <span className="db-ring-pct">0%</span>
              <span className="db-ring-sub">Complete</span>
            </div>
          </div>
        </div>
      </div>
      <div className="db-empty-hint">
        <div className="db-empty-hint-icon">📊</div>
        <p>Your stats, charts and recent tasks will appear here once you start adding tasks.</p>
      </div>
    </div>
  );

  return (
    <div className="page db-page">

      {/* Hero */}
      <div className="db-hero">
        <div className="db-hero-left">
          <p className="db-hero-greeting">Good {getTimeOfDay()}, {user?.username} 👋</p>
          <h1 className="db-hero-title">
            {dummy ? 'Welcome to TaskManager' : 'Your Dashboard'}
          </h1>
          <p className="db-hero-sub">
            {dummy
              ? 'Create your first project to get started. Here\'s a preview of what your dashboard will look like.'
              : `You have ${stats.inProgress} task${stats.inProgress !== 1 ? 's' : ''} in progress${stats.overdue > 0 ? ` and ${stats.overdue} overdue` : ''}.`}
          </p>
          <div className="db-hero-actions">
            <button className="btn-primary db-hero-btn" onClick={() => navigate('/projects')}>
              {dummy ? '🚀 Create First Project' : '📁 View Projects'}
            </button>
            {dummy && (
              <span className="db-preview-badge">👁 Preview mode — showing sample data</span>
            )}
          </div>
        </div>
        <div className="db-hero-right">
          <div className="db-completion-ring">
            <svg viewBox="0 0 120 120" className="db-ring-svg">
              <circle cx="60" cy="60" r="50" className="db-ring-track" />
              <circle cx="60" cy="60" r="50" className="db-ring-fill"
                strokeDasharray={`${(dummy ? DUMMY_STATS.completionRate : stats.completionRate) * 3.14} 314`} />
            </svg>
            <div className="db-ring-label">
              <span className="db-ring-pct">
                {dummy ? DUMMY_STATS.completionRate : stats.completionRate}%
              </span>
              <span className="db-ring-sub">Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="db-stats-grid">
        {STAT_CONFIG.map(cfg => (
          <StatCard key={cfg.key} cfg={cfg} value={data[cfg.key]} dummy={dummy} />
        ))}
      </div>

      {/* Bottom Row */}
      <div className="db-bottom">

        {/* Bar Chart */}
        <div className="db-card db-card--chart">
          <div className="db-card-header">
            <span className="db-card-title">Task Breakdown</span>
            {dummy && <span className="db-sample-tag">sample</span>}
          </div>
          <MiniBarChart done={data.done} inProgress={data.inProgress} todo={data.todo} dummy={dummy} />
          <div className="db-chart-legend">
            {[['#10b981','Done'],['#f59e0b','In Progress'],['#6366f1','To Do']].map(([c,l]) => (
              <span key={l} className="db-legend-item">
                <span className="db-legend-dot" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="db-card db-card--recent">
          <div className="db-card-header">
            <span className="db-card-title">Recent Tasks</span>
            {dummy && <span className="db-sample-tag">sample</span>}
          </div>
          <ul className="db-recent-list">
            {data.recentTasks.map(t => (
              <li key={t.id} className={`db-recent-item${dummy ? ' db-dummy-item' : ''}`}
                onClick={() => !dummy && navigate(`/projects/${t.projectId}`)}>
                <span className={`db-priority-dot db-priority-${t.priority.toLowerCase()}`} />
                <span className="db-recent-title">{t.title}</span>
                <span className={`db-status-chip db-status-${t.status.toLowerCase()}`}>
                  {t.status === 'InProgress' ? 'In Progress' : t.status}
                </span>
              </li>
            ))}
          </ul>
          {!dummy && (
            <button className="db-view-all" onClick={() => navigate('/projects')}>
              View all projects →
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="db-card db-card--quick">
          <div className="db-card-header">
            <span className="db-card-title">Highlights</span>
          </div>
          <div className="db-quick-list">
            <div className="db-quick-item db-quick-overdue">
              <span className="db-quick-icon">🚨</span>
              <div>
                <span className="db-quick-val">{data.overdue}</span>
                <span className="db-quick-label">Overdue tasks</span>
              </div>
            </div>
            <div className="db-quick-item db-quick-soon">
              <span className="db-quick-icon">⏰</span>
              <div>
                <span className="db-quick-val">{data.dueSoon}</span>
                <span className="db-quick-label">Due in 3 days</span>
              </div>
            </div>
            <div className="db-quick-item db-quick-high">
              <span className="db-quick-icon">🔥</span>
              <div>
                <span className="db-quick-val">{data.highPriority}</span>
                <span className="db-quick-label">High priority</span>
              </div>
            </div>
            <div className="db-quick-item db-quick-done">
              <span className="db-quick-icon">✅</span>
              <div>
                <span className="db-quick-val">{data.done}</span>
                <span className="db-quick-label">Completed</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
