import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(form.username, form.password);
      login(data.access_token, data.username);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="neu-card fade-up">
        <div style={styles.logoWrap}>
          <div style={styles.logo}>✦</div>
          <h1 style={styles.appName}>Taskly</h1>
        </div>

        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to your account</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              className="neu-input"
              type="text"
              name="username"
              placeholder="Your username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              className="neu-input"
              type="password"
              name="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="neu-btn neu-btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Sign In'}
          </button>
        </div>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    background: 'var(--bg)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1.8rem',
  },
  logo: {
    fontSize: '1.8rem',
    color: 'var(--accent)',
  },
  appName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  link: {
    color: 'var(--accent)',
    fontWeight: 700,
    textDecoration: 'none',
  },
};

export default LoginPage;
