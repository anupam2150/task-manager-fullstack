import { createContext, useContext, useState } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      token,
      username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      isAdmin: payload['isAdmin'] === 'true',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? parseToken(token) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const parsed = parseToken(data.token);
    setUser(parsed);
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', data.token);
    const parsed = parseToken(data.token);
    setUser(parsed);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext); // eslint-disable-line react-refresh/only-export-components
