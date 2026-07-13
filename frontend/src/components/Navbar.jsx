import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/api';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { notifications, unreadCount, markAllRead, dismiss } = useNotifications();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const bellRef = useRef();
  const userRef = useRef();
  const searchRef = useRef();
  const searchTimer = useRef();

  // Load avatar
  useEffect(() => {
    if (!user) return;
    api.get('/profile').then(({ data }) => setAvatarUrl(data.avatarUrl)).catch(() => {});
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get(`/projects?pageSize=100`);
        const projects = data.items ?? data;
        // Search project names
        const matched = projects.filter(p =>
          p.name.toLowerCase().includes(val.toLowerCase()) ||
          p.description?.toLowerCase().includes(val.toLowerCase())
        ).slice(0, 5);
        setSearchResults(matched);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const avatarContent = avatarUrl
    ? <img src={`${API_BASE}${avatarUrl}`} alt="avatar" className="avatar avatar-img" />
    : <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink to="/" className="brand">
          <div className="brand-icon">✓</div>
          TaskManager
        </NavLink>
        {user && (
          <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Dashboard</NavLink>
            <NavLink to="/projects" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Projects</NavLink>
          </div>
        )}
      </div>

      {user && (
        <div className="nav-center" ref={searchRef}>
          <div className="nav-search-wrap">
            <span className="nav-search-icon">🔍</span>
            <input
              className="nav-search"
              placeholder="Search projects..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {searching && <span className="nav-search-spin">⏳</span>}
          </div>
          {searchResults.length > 0 && (
            <div className="nav-search-dropdown">
              {searchResults.map(p => (
                <div key={p.id} className="nav-search-item" onClick={() => {
                  navigate(`/projects/${p.id}`);
                  setSearch(''); setSearchResults([]);
                }}>
                  <span className="nav-search-item-icon">📁</span>
                  <div>
                    <div className="nav-search-item-name">{p.name}</div>
                    {p.description && <div className="nav-search-item-desc">{p.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {search && searchResults.length === 0 && !searching && (
            <div className="nav-search-dropdown">
              <div className="nav-search-empty">No projects found</div>
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggle} title="Toggle dark mode">
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Bell */}
          <div className="nav-bell-wrap" ref={bellRef}>
            <button className="nav-bell" onClick={() => { setShowBell(s => !s); if (!showBell && unreadCount > 0) markAllRead(); }}>
              🔔
              {unreadCount > 0 && <span className="nav-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showBell && (
              <div className="nav-notif-dropdown">
                <div className="nav-notif-header">
                  <span>Notifications</span>
                  {notifications.length > 0 && <button className="nav-notif-clear" onClick={markAllRead}>Mark all read</button>}
                </div>
                {notifications.length === 0
                  ? <div className="nav-notif-empty">🎉 All caught up!</div>
                  : notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`nav-notif-item nav-notif-${n.type}${n.isRead ? ' nav-notif-read' : ''}`}>
                      <span className="nav-notif-msg">{n.message}</span>
                      <div className="nav-notif-meta">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        <button className="btn-icon-sm" onClick={() => dismiss(n.id)}>✕</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="nav-user-wrap" ref={userRef}>
            <button className="nav-user-btn" onClick={() => setShowUserMenu(s => !s)}>
              {avatarContent}
              <span className="nav-username">{user.username}</span>
              <span className="nav-chevron">▾</span>
            </button>
            {showUserMenu && (
              <div className="nav-user-dropdown">
                <div className="nav-user-info">
                  <strong>{user.username}</strong>
                </div>
                <button className="nav-user-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  👤 Profile
                </button>
                <button className="nav-user-item nav-user-item--danger" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
