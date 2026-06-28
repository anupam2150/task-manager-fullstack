import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const extractError = (err) => {
  const data = err.response?.data;
  if (!data) return 'Registration failed. Please check your connection and try again.';
  if (typeof data === 'string') return data;
  if (data.errors) return Object.values(data.errors).flat().join(' ');
  if (data.title) return data.title;
  return 'Registration failed. Please try again.';
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Username (3-50 characters)" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} required />
        <small className="hint">
          Min 8 characters with uppercase, lowercase, digit and special character (e.g. Test@1234)
        </small>
        <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
