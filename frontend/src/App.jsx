import { useState, useEffect, useMemo } from 'react';
import * as api from './api';
import './App.css';

export default function App() {
  // Theme state: dark / light
  const [theme, setTheme] = useState(() => localStorage.getItem('taskflow_theme') || 'dark');

  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode: 'list' or 'board'
  const [activeView, setActiveView] = useState('list');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [taskError, setTaskError] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);

  // Load tasks on auth / filter change
  useEffect(() => {
    if (token) {
      loadTasks();
    }
  }, [token, filterStatus, sortBy]);

  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const data = await api.fetchTasks(filterStatus, sortBy);
      setTasks(data);
    } catch (err) {
      console.error(err);
      if (err.message.includes('token') || err.message.includes('denied') || err.message.includes('expired')) {
        handleLogout();
      }
    } finally {
      setLoadingTasks(false);
    }
  }

  // Auth Submit
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegister) {
        const data = await api.register(authName, authEmail, authPassword);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        const data = await api.login(authEmail, authPassword);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTasks([]);
    setIsModalOpen(false);
  }

  // Modal Handlers
  function openNewTaskModal() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setStatus('pending');
    setPriority('medium');
    setCategory('General');
    setDueDate('');
    setTaskError('');
    setIsModalOpen(true);
  }

  function openEditTaskModal(t) {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description || '');
    setStatus(t.status);
    setPriority(t.priority || 'medium');
    setCategory(t.category || 'General');
    setDueDate(t.due_date ? t.due_date.split('T')[0] : '');
    setTaskError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setTaskError('');
  }

  // Save Task
  async function handleTaskSubmit(e) {
    e.preventDefault();
    setTaskError('');
    setSavingTask(true);
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        category,
        dueDate: dueDate || null
      };

      if (editingId) {
        await api.updateTask(editingId, payload);
      } else {
        await api.createTask(payload);
      }
      closeModal();
      loadTasks();
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setSavingTask(false);
    }
  }

  // Helper to move a task to another status
  async function handleMoveStatus(taskId, currentTask, targetStatus) {
    try {
      await api.updateTask(taskId, {
        title: currentTask.title,
        description: currentTask.description,
        status: targetStatus,
        priority: currentTask.priority || 'medium',
        category: currentTask.category || 'General',
        dueDate: currentTask.due_date ? currentTask.due_date.split('T')[0] : null
      });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  // Toggle status
  async function handleToggleStatus(t) {
    const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(t.id, {
        title: t.title,
        description: t.description,
        status: nextStatus,
        priority: t.priority || 'medium',
        category: t.category || 'General',
        dueDate: t.due_date ? t.due_date.split('T')[0] : null
      });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete Confirmation State
  const [taskToDelete, setTaskToDelete] = useState(null);

  function requestDelete(id, title) {
    setTaskToDelete({ id, title: title || 'this task' });
  }

  function cancelDelete() {
    setTaskToDelete(null);
  }

  async function confirmDelete() {
    if (!taskToDelete) return;
    try {
      await api.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // Helper date metrics
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const openCount = totalCount - completedCount;
  const dueTodayCount = tasks.filter(
    (t) => t.due_date && t.due_date.split('T')[0] === todayStr && t.status !== 'completed'
  ).length;
  const overdueCount = tasks.filter(
    (t) => t.due_date && t.due_date.split('T')[0] < todayStr && t.status !== 'completed'
  ).length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Formatted date string for greeting
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Filter tasks by keyword search, status, priority, and category
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title && t.title.toLowerCase().includes(q);
        const matchDesc = t.description && t.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      // Priority filter
      if (filterPriority && t.priority !== filterPriority) {
        return false;
      }
      // Category filter
      if (filterCategory && t.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterCategory]);

    // Helper to move a task to another status
  async function handleMoveStatus(taskId, currentTask, targetStatus) {
    try {
      await api.updateTask(taskId, {
        title: currentTask.title,
        description: currentTask.description,
        dueDate: currentTask.due_date ? currentTask.due_date.split('T')[0] : null,
        status: targetStatus
      });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }


  // Auth Screen
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo-icon auth-logo-large">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="#18181b" stroke="var(--border-color)" strokeWidth="1.2"/>
                <path d="M7 10.5C7 9.67 7.67 9 8.5 9H17.5C18.33 9 19 9.67 19 10.5V19.5C19 20.33 18.33 21 17.5 21H8.5C7.67 21 7 20.33 7 19.5V10.5Z" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1.2"/>
                <path d="M13 14.5C13 13.67 13.67 13 14.5 13H23.5C24.33 13 25 13.67 25 14.5V23.5C25 24.33 24.33 25 23.5 25H14.5C13.67 25 13 24.33 13 23.5V14.5Z" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.2"/>
                <path d="M16 19.5L18.5 22L22.5 16.5" stroke="var(--text-main)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>{isRegister ? 'Create an Account' : 'Welcome to TaskFlow'}</h2>
            <p>{isRegister ? 'Set up your workspace to manage tasks' : 'Enter your details to sign in'}</p>
          </div>

          {authError && <div className="alert alert-error">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegister && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anuj"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={authLoading}>
              {authLoading ? 'Signing in...' : isRegister ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="auth-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError('');
              }}
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-left">
          <div className="brand-group">
            <div className="brand-logo-icon">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="#18181b" stroke="var(--border-color)" strokeWidth="1.2"/>
                <path d="M7 10.5C7 9.67 7.67 9 8.5 9H17.5C18.33 9 19 9.67 19 10.5V19.5C19 20.33 18.33 21 17.5 21H8.5C7.67 21 7 20.33 7 19.5V10.5Z" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1.2"/>
                <path d="M13 14.5C13 13.67 13.67 13 14.5 13H23.5C24.33 13 25 13.67 25 14.5V23.5C25 24.33 24.33 25 23.5 25H14.5C13.67 25 13 24.33 13 23.5V14.5Z" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.2"/>
                <path d="M16 19.5L18.5 22L22.5 16.5" stroke="var(--text-main)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand-title">TaskFlow</span>
          </div>

          <div className="navbar-search">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="user-profile-pill">
            <div className="user-avatar">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <span className="user-name">{user?.name || user?.email?.split('@')[0]}</span>
            <button onClick={handleLogout} className="btn-logout" title="Sign out">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-content">
        {/* Header Greeting Banner */}
        <div className="header-greeting-banner">
          <div className="greeting-text">
            <span className="greeting-date">{formattedToday}</span>
            <h1 className="greeting-heading">
              {greetingTime}, {user?.name || 'there'}
            </h1>
            <p className="greeting-subtitle">
              You have {openCount} open task{openCount === 1 ? '' : 's'}
              {overdueCount > 0 ? ` and ${overdueCount} overdue.` : '.'}
            </p>
          </div>

          <button className="btn btn-primary btn-cta" onClick={openNewTaskModal}>
            <span className="plus-icon">+</span> New task
          </button>
        </div>

        {/* 4 Metric Overview Cards */}
        <section className="overview-metrics-grid">
          <div className="metric-box">
            <div className="metric-top">
              <span className="metric-label">Open tasks</span>
              <div className="metric-icon-wrap icon-open">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{openCount}</div>
            <div className="metric-subtext">Across your workspace</div>
          </div>

          <div className="metric-box">
            <div className="metric-top">
              <span className="metric-label">Due today</span>
              <div className="metric-icon-wrap icon-today">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{dueTodayCount}</div>
            <div className="metric-subtext">Requires focus</div>
          </div>

          <div className="metric-box">
            <div className="metric-top">
              <span className="metric-label">Completed</span>
              <div className="metric-icon-wrap icon-completed">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{completedCount}</div>
            <div className="metric-subtext">All time finished</div>
          </div>

          <div className="metric-box">
            <div className="metric-top">
              <span className="metric-label">Overdue</span>
              <div className="metric-icon-wrap icon-overdue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{overdueCount}</div>
            <div className="metric-subtext">{overdueCount > 0 ? 'Needs attention' : 'All up to date'}</div>
          </div>
        </section>


        {/* 2-Column Split: Task List on Left, Progress Overview on Right */}
        <div className="dashboard-split-layout">
          {/* Left Column: Tasks Section */}
          <section className="tasks-main-section">
            <div className="section-header-row">
              <div className="section-title-group">
                <h2>Tasks</h2>
                <span className="tasks-progress-badge">
                  {completedCount} of {totalCount} done
                </span>
              </div>

              {/* Status Filter Tabs */}
              <div className="status-filter-pills">
                <button
                  className={`pill-btn ${filterStatus === '' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('')}
                >
                  All ({totalCount})
                </button>
                <button
                  className={`pill-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  className={`pill-btn ${filterStatus === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('in-progress')}
                >
                  In Progress ({inProgressCount})
                </button>
                <button
                  className={`pill-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('completed')}
                >
                  Done ({completedCount})
                </button>
              </div>

              {/* Toolbar Dropdowns: Priority, Category & Sort + View Switcher */}
              <div className="toolbar-extra-filters">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="filter-mini-select"
                  title="Filter by Priority"
                >
                  <option value="">All Priorities</option>
                  <option value="high">🔥 High</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="low">🌱 Low</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-mini-select"
                  title="Filter by Category"
                >
                  <option value="">All Categories</option>
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                  <option value="Design">Design</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-mini-select"
                  title="Sort Tasks"
                >
                  <option value="newest">Newest First</option>
                  <option value="dueDate">Due Date</option>
                </select>

                {/* View Switcher: List vs Kanban Board */}
                <div className="view-switcher-group">
                  <button
                    className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveView('list')}
                    title="List View"
                  >
                    ≡ List
                  </button>
                  <button
                    className={`view-btn ${activeView === 'board' ? 'active' : ''}`}
                    onClick={() => setActiveView('board')}
                    title="Kanban Board View"
                  >
                    ▦ Board
                  </button>
                </div>
              </div>
            </div>

            {/* Content Rendering: Kanban Board vs List View */}
            {loadingTasks ? (
              <div className="empty-panel">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-panel">
                <p className="empty-panel-title">No tasks found</p>
                <p className="empty-panel-subtitle">
                  {searchQuery ? `No tasks matching "${searchQuery}"` : 'Your workspace is clear!'}
                </p>
                <button className="btn btn-secondary btn-sm" onClick={openNewTaskModal}>
                  + Add a new task
                </button>
              </div>
            ) : activeView === 'board' ? (
              /* --- KANBAN BOARD VIEW --- */
              <div className="kanban-board">
                {/* 1. To Do Column */}
                <div className="kanban-column">
                  <div className="kanban-col-header col-todo">
                    <span className="col-title">To Do</span>
                    <span className="col-count">{pendingCount}</span>
                  </div>
                  <div className="kanban-cards-wrapper">
                    {filteredTasks.filter((t) => t.status === 'pending').map((t) => (
                      <div key={t.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <span className="kanban-card-title">{t.title}</span>
                          <div className="kanban-card-actions">
                            <button onClick={() => openEditTaskModal(t)} className="action-icon-btn" title="Edit">✏️</button>
                            <button onClick={() => requestDelete(t.id, t.title)} className="action-icon-btn action-delete" title="Delete">🗑️</button>
                          </div>
                        </div>
                        {t.description && <p className="kanban-card-desc">{t.description}</p>}
                        <div className="kanban-card-tags">
                          {t.priority && (
                            <span className={`priority-pill priority-${t.priority}`}>
                              {t.priority === 'high' ? '🔥 High' : t.priority === 'low' ? '🌱 Low' : '⚡ Medium'}
                            </span>
                          )}
                          {t.category && (
                            <span className="category-pill">{t.category}</span>
                          )}
                        </div>
                        <div className="kanban-card-footer">
                          {t.due_date && <span className="kanban-date">📅 {t.due_date.split('T')[0]}</span>}
                          <div className="kanban-move-actions">
                            <button onClick={() => handleMoveStatus(t.id, t, 'in-progress')} title="Move to In Progress">
                              → In Progress
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. In Progress Column */}
                <div className="kanban-column">
                  <div className="kanban-col-header col-progress">
                    <span className="col-title">In Progress</span>
                    <span className="col-count">{inProgressCount}</span>
                  </div>
                  <div className="kanban-cards-wrapper">
                    {filteredTasks.filter((t) => t.status === 'in-progress').map((t) => (
                      <div key={t.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <span className="kanban-card-title">{t.title}</span>
                          <div className="kanban-card-actions">
                            <button onClick={() => openEditTaskModal(t)} className="action-icon-btn" title="Edit">✏️</button>
                            <button onClick={() => requestDelete(t.id, t.title)} className="action-icon-btn action-delete" title="Delete">🗑️</button>
                          </div>
                        </div>
                        {t.description && <p className="kanban-card-desc">{t.description}</p>}
                        <div className="kanban-card-tags">
                          {t.priority && (
                            <span className={`priority-pill priority-${t.priority}`}>
                              {t.priority === 'high' ? '🔥 High' : t.priority === 'low' ? '🌱 Low' : '⚡ Medium'}
                            </span>
                          )}
                          {t.category && (
                            <span className="category-pill">{t.category}</span>
                          )}
                        </div>
                        <div className="kanban-card-footer">
                          {t.due_date && <span className="kanban-date">📅 {t.due_date.split('T')[0]}</span>}
                          <div className="kanban-move-actions">
                            <button onClick={() => handleMoveStatus(t.id, t, 'pending')} title="Move back to To Do">
                              ← To Do
                            </button>
                            <button onClick={() => handleMoveStatus(t.id, t, 'completed')} title="Move to Done">
                              ✓ Done
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Done Column */}
                <div className="kanban-column">
                  <div className="kanban-col-header col-done">
                    <span className="col-title">Done</span>
                    <span className="col-count">{completedCount}</span>
                  </div>
                  <div className="kanban-cards-wrapper">
                    {filteredTasks.filter((t) => t.status === 'completed').map((t) => (
                      <div key={t.id} className="kanban-card kanban-card-done">
                        <div className="kanban-card-header">
                          <span className="kanban-card-title strikethrough">{t.title}</span>
                          <div className="kanban-card-actions">
                            <button onClick={() => openEditTaskModal(t)} className="action-icon-btn" title="Edit">✏️</button>
                            <button onClick={() => requestDelete(t.id, t.title)} className="action-icon-btn action-delete" title="Delete">🗑️</button>
                          </div>
                        </div>
                        {t.description && <p className="kanban-card-desc">{t.description}</p>}
                        <div className="kanban-card-tags">
                          {t.priority && (
                            <span className={`priority-pill priority-${t.priority}`}>
                              {t.priority === 'high' ? '🔥 High' : t.priority === 'low' ? '🌱 Low' : '⚡ Medium'}
                            </span>
                          )}
                          {t.category && (
                            <span className="category-pill">{t.category}</span>
                          )}
                        </div>
                        <div className="kanban-card-footer">
                          {t.due_date && <span className="kanban-date">📅 {t.due_date.split('T')[0]}</span>}
                          <div className="kanban-move-actions">
                            <button onClick={() => handleMoveStatus(t.id, t, 'in-progress')} title="Reopen to In Progress">
                              ↺ Reopen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* --- EXISTING LIST VIEW --- */
              <div className="task-items-list">
                {filteredTasks.map((t) => {
                  const isCompleted = t.status === 'completed';
                  const isOverdue = t.due_date && t.due_date.split('T')[0] < todayStr && !isCompleted;
                  const isDueToday = t.due_date && t.due_date.split('T')[0] === todayStr && !isCompleted;

                  return (
                    <div
                      key={t.id}
                      className={`task-row-card ${isCompleted ? 'is-completed' : ''}`}
                    >
                      {/* Circular Checkbox */}
                      <button
                        className={`circle-checkbox ${isCompleted ? 'checked' : ''}`}
                        onClick={() => handleToggleStatus(t)}
                        title={isCompleted ? 'Mark as pending' : 'Mark as done'}
                      >
                        {isCompleted && (
                          <svg className="check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Content */}
                      <div className="task-row-content">
                        <span className={`task-row-title ${isCompleted ? 'strikethrough' : ''}`}>
                          {t.title}
                        </span>

                        {t.description && (
                          <p className="task-row-desc">{t.description}</p>
                        )}

                        <div className="task-row-meta">
                          {t.priority && (
                            <span className={`priority-pill priority-${t.priority}`}>
                              {t.priority === 'high' ? '🔥 High' : t.priority === 'low' ? '🌱 Low' : '⚡ Medium'}
                            </span>
                          )}

                          {t.category && t.category !== 'General' && (
                            <span className="category-pill">
                              {t.category === 'Work' ? '💼' : t.category === 'Personal' ? '👤' : t.category === 'Feature' ? '🚀' : t.category === 'Bug' ? '🐛' : t.category === 'Design' ? '🎨' : '📌'} {t.category}
                            </span>
                          )}

                          {t.due_date && (
                            <span className={`meta-pill ${isOverdue ? 'pill-overdue' : isDueToday ? 'pill-today' : 'pill-date'}`}>
                              📅 {isDueToday ? 'Today' : isOverdue ? 'Overdue' : new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}

                          <span className={`status-pill status-${t.status}`}>
                            {t.status === 'in-progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div className="task-row-actions">
                        <button
                          onClick={() => openEditTaskModal(t)}
                          className="action-icon-btn"
                          title="Edit Task"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => requestDelete(t.id, t.title)}
                          className="action-icon-btn action-delete"
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Column: Progress Overview Gauge */}
          <aside className="progress-overview-sidebar">
            <div className="progress-widget-card">
              <h3>Progress overview</h3>

              {/* Circular SVG Progress Gauge */}
              <div className="gauge-center-wrapper">
                <div className="gauge-svg-container">
                  <svg className="gauge-svg" viewBox="0 0 120 120">
                    <circle
                      className="gauge-track"
                      cx="60"
                      cy="60"
                      r="48"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      className="gauge-progress"
                      cx="60"
                      cy="60"
                      r="48"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - completionPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="gauge-text-overlay">
                    <span className="gauge-percent">{completionPercentage}%</span>
                    <span className="gauge-label">Completed</span>
                  </div>
                </div>
              </div>

              <div className="gauge-stats-row">
                <div className="gauge-stat">
                  <span className="stat-num">{completedCount}</span>
                  <span className="stat-txt">Done</span>
                </div>
                <div className="gauge-divider" />
                <div className="gauge-stat">
                  <span className="stat-num">{openCount}</span>
                  <span className="stat-txt">Remaining</span>
                </div>
              </div>

              {/* Multi-segment status progress bar */}
              <div className="segmented-progress-bar">
                <div
                  className="bar-seg seg-done"
                  style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
                />
                <div
                  className="bar-seg seg-progress"
                  style={{ width: `${totalCount ? (inProgressCount / totalCount) * 100 : 0}%` }}
                />
                <div
                  className="bar-seg seg-pending"
                  style={{ width: `${totalCount ? (pendingCount / totalCount) * 100 : 0}%` }}
                />
              </div>

              {/* Progress Legend */}
              <div className="progress-legend">
                <div className="legend-item">
                  <span className="legend-dot dot-done" />
                  <span className="legend-text">Completed</span>
                  <span className="legend-count">{completedCount}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-progress" />
                  <span className="legend-text">In progress</span>
                  <span className="legend-count">{inProgressCount}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-pending" />
                  <span className="legend-text">To do</span>
                  <span className="legend-count">{pendingCount}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Task Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Task' : 'Create New Task'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {taskError && <div className="alert alert-error">{taskError}</div>}

            <form onSubmit={handleTaskSubmit} className="modal-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Design System Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Key context, milestones, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">🌱 Low</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="high">🔥 High / Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="General">📌 General</option>
                    <option value="Work">💼 Work</option>
                    <option value="Personal">👤 Personal</option>
                    <option value="Feature">🚀 Feature</option>
                    <option value="Bug">🐛 Bug</option>
                    <option value="Design">🎨 Design</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingTask}>
                  {savingTask ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modern Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-dialog modal-dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Task</h3>
              <button className="modal-close" onClick={cancelDelete}>✕</button>
            </div>
            <div className="modal-body-confirm">
              <p>Are you sure you want to permanently delete <strong>"{taskToDelete.title}"</strong>?</p>
              <span className="confirm-warning">This action cannot be undone.</span>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={cancelDelete} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger">
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
