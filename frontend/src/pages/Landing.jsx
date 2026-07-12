import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📋', title: 'Kanban Board', desc: 'Drag & drop tasks across Todo, In Progress and Done columns with smooth animations.' },
  { icon: '⏱', title: 'Time Tracking', desc: 'Start/stop timers per task. Automatically logs time spent so you know where your hours go.' },
  { icon: '🔁', title: 'Recurring Tasks', desc: 'Set daily, weekly or monthly recurrence. Tasks auto-spawn when completed.' },
  { icon: '🔗', title: 'Task Dependencies', desc: 'Mark tasks as blocked-by others. Circular dependency detection built in.' },
  { icon: '📊', title: 'Dashboard Analytics', desc: 'Live stats — completion rate, overdue count, high priority tasks and recent activity.' },
  { icon: '🏷️', title: 'Labels & Subtasks', desc: 'Color-coded labels, subtask checklists with progress bars, and per-task comments.' },
  { icon: '📦', title: 'Archive & Restore', desc: 'Archive completed tasks to keep your board clean. Restore anytime.' },
  { icon: '🔒', title: 'Public Sharing', desc: 'Generate a read-only shareable link for any project. Revoke anytime.' },
  { icon: '⬇️', title: 'CSV Export', desc: 'Download all tasks with subtasks, labels, time spent and recurrence as CSV.' },
  { icon: '🌙', title: 'Dark Mode', desc: 'Auto dark/light mode from OS preference with manual toggle.' },
  { icon: '🔔', title: 'Notifications', desc: 'In-app bell alerts for overdue and due-soon tasks. Never miss a deadline.' },
  { icon: '📅', title: 'Calendar View', desc: 'See all your tasks with due dates laid out on a monthly calendar.' },
];

const STATS = [
  { value: '12+', label: 'Features' },
  { value: '100%', label: 'Free to use' },
  { value: 'React 19', label: 'Frontend' },
  { value: '.NET 10', label: 'Backend' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand">
            <div className="brand-icon">✓</div>
            TaskManager
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#about" className="landing-nav-link">About</a>
            <button className="btn-outline landing-login-btn" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary landing-cta-sm" onClick={() => navigate('/register')}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">✨ Built with ASP.NET Core 10 + React 19</div>
          <h1 className="landing-hero-title">
            Manage your tasks<br />
            <span className="landing-hero-gradient">like a pro</span>
          </h1>
          <p className="landing-hero-sub">
            A full-featured task management app with Kanban boards, time tracking,
            recurring tasks, analytics and more. Built by a developer, for developers.
          </p>
          <div className="landing-hero-actions">
            <button className="btn-primary landing-hero-cta" onClick={() => navigate('/register')}>
              🚀 Get Started — It's Free
            </button>
            <button className="btn-outline landing-hero-demo" onClick={() => navigate('/login')}>
              👁 View Demo
            </button>
          </div>
          <div className="landing-stats">
            {STATS.map(s => (
              <div key={s.label} className="landing-stat">
                <span className="landing-stat-value">{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-mock">
            <div className="landing-mock-bar">
              <span className="mock-dot mock-dot-r" /><span className="mock-dot mock-dot-y" /><span className="mock-dot mock-dot-g" />
              <span className="mock-title">TaskManager — Dashboard</span>
            </div>
            <div className="landing-mock-body">
              <div className="mock-stat-row">
                {[['📁','6','Projects','#6366f1'],['📋','47','Tasks','#0ea5e9'],['✅','31','Done','#10b981'],['⚡','9','Active','#f59e0b']].map(([icon,val,label,color]) => (
                  <div key={label} className="mock-stat" style={{ borderTopColor: color }}>
                    <span>{icon}</span>
                    <strong style={{ color }}>{val}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
              <div className="mock-kanban">
                {[['To Do','#6366f1',['Design UI','Write tests']],['In Progress','#f59e0b',['Build API','Fix bug']],['Done','#10b981',['Auth flow','DB setup']]].map(([col,color,tasks]) => (
                  <div key={col} className="mock-col" style={{ borderTopColor: color }}>
                    <div className="mock-col-header" style={{ color }}>{col}</div>
                    {tasks.map(t => <div key={t} className="mock-task">{t}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="landing-section-inner">
          <p className="landing-section-tag">Everything you need</p>
          <h2 className="landing-section-title">Packed with powerful features</h2>
          <p className="landing-section-sub">From simple task tracking to advanced project management — all in one place.</p>
          <div className="landing-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Built by */}
      <section className="landing-about" id="about">
        <div className="landing-section-inner landing-about-inner">
          <div className="landing-about-text">
            <p className="landing-section-tag">The Developer</p>
            <h2 className="landing-section-title">Built by SNIVO</h2>
            <p className="landing-about-desc">
              This project was built as a personal tool to manage my own development workflow —
              and ended up becoming a full-featured task management platform.
              Every feature was driven by real usage: time tracking to measure focus,
              recurring tasks for daily habits, dependencies to manage blockers.
            </p>
            <p className="landing-about-desc">
              Built with ASP.NET Core 10, Entity Framework, React 19, and a lot of coffee ☕
            </p>
            <button className="btn-primary" onClick={() => navigate('/register')}>Try it yourself →</button>
          </div>
          <div className="landing-about-card">
            <div className="landing-about-avatar">S</div>
            <div className="landing-about-name">SNIVO</div>
            <div className="landing-about-role">Full Stack Developer</div>
            <div className="landing-about-tags">
              {['ASP.NET Core', 'React', 'EF Core', 'SQLite', 'JWT'].map(t => (
                <span key={t} className="landing-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-section-inner landing-cta-inner">
          <h2>Ready to get organized?</h2>
          <p>Join and start managing your tasks smarter today.</p>
          <button className="btn-primary landing-hero-cta" onClick={() => navigate('/register')}>
            🚀 Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-nav-inner">
          <span>© 2025 TaskManager · Built by SNIVO</span>
          <div className="landing-nav-links">
            <button className="landing-nav-link" onClick={() => navigate('/login')}>Login</button>
            <button className="landing-nav-link" onClick={() => navigate('/register')}>Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
