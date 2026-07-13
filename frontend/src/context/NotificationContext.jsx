import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    try {
      await api.post('/notifications/generate');
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [load]);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    } catch { /* silent — UI stays consistent */ }
  }, []);

  const dismiss = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(n => n.filter(x => x.id !== id));
    } catch { /* silent */ }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, dismiss, reload: load }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext); // eslint-disable-line react-refresh/only-export-components
