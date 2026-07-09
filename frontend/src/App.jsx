import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotifProvider } from './context/NotifContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import PublicProject from './pages/PublicProject';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotifProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<PrivateRoute><Projects /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/projects/:projectId" element={<PrivateRoute><Tasks /></PrivateRoute>} />
              <Route path="/share/:token" element={<PublicProject />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </NotifProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
