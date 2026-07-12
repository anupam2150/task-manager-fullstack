import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotifProvider } from './context/NotifContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import OnboardingTour from './components/OnboardingTour';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import PublicProject from './pages/PublicProject';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotifProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Navbar />
              <OnboardingTour />
              <Routes>
                <Route path="/welcome" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
                <Route path="/projects/:projectId" element={<PrivateRoute><Tasks /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/share/:token" element={<PublicProject />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </NotifProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
