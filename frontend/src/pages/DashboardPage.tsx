import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Todo } from '../types';

const DashboardPage: React.FC = () => {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const fetchTodos = useCallback(async () => {
    if (!token) return;
    try {
      // Verify protected route first
      await api.getProtected(token);
      const data = await api.getTodos(token);
      setTodos(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('expired')) {
        logout();
        navigate('/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load todos');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !token) return;
    setAdding(true);
    try {
      const todo = await api.createTodo(newTitle.trim(), token);
      setTodos(prev => [todo, ...prev]);
      setNewTitle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    if (!token) return;
    try {
      const updated = await api.updateTodo(todo.id, { completed: !todo.completed }, token);
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteTodo(id, token);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.title);
  };

  const saveEdit = async (id: string) => {
    if (!token || !editText.trim()) return;
    try {
      const updated = await api.updateTodo(id, { title: editText.trim() }, token);
      setTodos(prev => prev.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const doneCount = todos.filter(t => t.completed).length;
  const progress = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header} className="neu-card fade-up">
          <div style={styles.headerLeft}>
            <span style={styles.logo}>✦</span>
            <div>
              <h1 style={styles.appName}>Taskly</h1>
              <p style={styles.greeting}>Hey, <strong>{username}</strong> 👋</p>
            </div>
          </div>
          <button className="neu-btn" onClick={handleLogout} style={{ padding: '0.6rem 1rem' }}>
            <span>⎋</span> Logout
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow} className="fade-up">
          <div className="neu-card" style={styles.statCard}>
            <p style={styles.statNum}>{todos.length}</p>
            <p style={styles.statLabel}>Total</p>
          </div>
          <div className="neu-card" style={styles.statCard}>
            <p style={styles.statNum}>{todos.length - doneCount}</p>
            <p style={styles.statLabel}>Active</p>
          </div>
          <div className="neu-card" style={styles.statCard}>
            <p style={styles.statNum}>{doneCount}</p>
            <p style={styles.statLabel}>Done</p>
          </div>
        </div>

        {/* Progress */}
        {todos.length > 0 && (
          <div className="neu-card fade-up" style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>Today's progress</span>
              <span style={styles.progressPct}>{progress}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Add Todo */}
        <div className="neu-card fade-up" style={styles.addCard}>
          <div style={styles.addRow}>
            <input
              className="neu-input"
              placeholder="Add a new task…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1 }}
            />
            <button
              className="neu-btn neu-btn-primary"
              onClick={handleAdd}
              disabled={adding || !newTitle.trim()}
              style={{ flexShrink: 0 }}
            >
              {adding ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : '＋ Add'}
            </button>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterRow} className="fade-up">
          {(['all', 'active', 'done'] as const).map(f => (
            <button
              key={f}
              className="neu-btn"
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                justifyContent: 'center',
                color: filter === f ? 'var(--accent)' : undefined,
                fontWeight: filter === f ? 800 : 600,
                boxShadow: filter === f ? 'var(--neu-pressed)' : 'var(--neu-flat)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div style={styles.list} className="fade-up">
          {loading ? (
            <div style={styles.center}>
              <span className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty} className="neu-card">
              <p style={styles.emptyIcon}>🍃</p>
              <p style={styles.emptyText}>
                {filter === 'all' ? 'No tasks yet. Add one above!' : `No ${filter} tasks.`}
              </p>
            </div>
          ) : (
            filtered.map(todo => (
              <div
                key={todo.id}
                className="neu-card"
                style={{
                  ...styles.todoItem,
                  opacity: todo.completed ? 0.7 : 1,
                }}
              >
                <input
                  type="checkbox"
                  className="neu-checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                />

                {editingId === todo.id ? (
                  <input
                    className="neu-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(todo.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    }}
                  >
                    {todo.title}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {editingId === todo.id ? (
                    <>
                      <button
                        className="neu-btn-icon"
                        onClick={() => saveEdit(todo.id)}
                        title="Save"
                        style={{ color: 'var(--success)' }}
                      >✓</button>
                      <button
                        className="neu-btn-icon"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >✕</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="neu-btn-icon"
                        onClick={() => startEdit(todo)}
                        title="Edit"
                      >✎</button>
                      <button
                        className="neu-btn-icon"
                        onClick={() => handleDelete(todo.id)}
                        title="Delete"
                        style={{ color: 'var(--danger)' }}
                      >🗑</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '1.5rem',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logo: {
    fontSize: '1.5rem',
    color: 'var(--accent)',
  },
  appName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '1.1rem',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  greeting: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1rem',
  },
  statCard: {
    textAlign: 'center',
    padding: '1rem',
  },
  statNum: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--accent)',
    fontFamily: "'Space Mono', monospace",
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  progressCard: {
    padding: '1.25rem 1.5rem',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.6rem',
  },
  progressLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  progressPct: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'var(--accent)',
  },
  progressTrack: {
    height: '10px',
    borderRadius: '10px',
    background: 'var(--bg)',
    boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    background: 'linear-gradient(90deg, var(--accent-light), var(--accent))',
    transition: 'width 0.5s ease',
  },
  addCard: {
    padding: '1.25rem 1.5rem',
  },
  addRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  filterRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingBottom: '2rem',
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    transition: 'opacity 0.2s',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
  },
  empty: {
    textAlign: 'center',
    padding: '2.5rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
};

export default DashboardPage;
