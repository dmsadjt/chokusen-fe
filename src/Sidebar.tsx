import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from './auth/useAuth';
import { API_BASE } from './lib/api';
import type { Workspace } from './types';
import './Sidebar.css';

type Status = 'loading' | 'loaded' | 'error';

const COLLAPSED_KEY = 'chokusen-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

type SidebarProps = {
  selectedWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
};

function Sidebar({ selectedWorkspaceId, onSelect }: SidebarProps) {
  const { user, refresh } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const loadWorkspaces = () => {
    setStatus('loading');
    return fetch(`${API_BASE}/workspaces/mine`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load workspaces');
        return res.json();
      })
      .then((data: Workspace[]) => {
        setWorkspaces(data);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  };

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch(`${API_BASE}/workspaces`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Failed to create workspace');
      }

      setName('');
      await loadWorkspaces();
    } catch {
      setCreateError("Couldn't create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      await refresh();
    }
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // storage unavailable; the toggle still works for this session
    }
  };

  const toggleButton = (
    <button
      type="button"
      className="sidebar__toggle"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'Expand workspaces' : 'Collapse workspaces'}
      aria-expanded={!collapsed}
    >
      {collapsed ? '»' : '«'}
    </button>
  );

  if (collapsed) {
    return (
      <nav className="sidebar sidebar--collapsed" aria-label="Workspaces">
        <div className="sidebar__header">{toggleButton}</div>
        <ul className="sidebar__list">
          {workspaces.map((ws) => (
            <li key={ws.workspaceId}>
              <button
                type="button"
                title={ws.workspaceName}
                aria-label={ws.workspaceName}
                className={`sidebar__initial${ws.workspaceId === selectedWorkspaceId ? ' sidebar__initial--active' : ''}`}
                onClick={() => onSelect(ws.workspaceId)}
              >
                {ws.workspaceName.charAt(0).toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="sidebar" aria-label="Workspaces">
      <div className="sidebar__header">
        <h2 className="sidebar__heading">Workspaces</h2>
        {toggleButton}
      </div>

      {status === 'loading' && <p className="sidebar__hint">Loading…</p>}
      {status === 'error' && (
        <p className="sidebar__hint sidebar__hint--error">Couldn't load workspaces</p>
      )}
      {status === 'loaded' && workspaces.length === 0 && (
        <p className="sidebar__hint">No workspaces yet</p>
      )}
      {status === 'loaded' && workspaces.length > 0 && (
        <ul className="sidebar__list">
          {workspaces.map((ws) => (
            <li key={ws.workspaceId}>
              <button
                type="button"
                className={`sidebar__item${ws.workspaceId === selectedWorkspaceId ? ' sidebar__item--active' : ''}`}
                onClick={() => onSelect(ws.workspaceId)}
              >
                {ws.workspaceName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="sidebar__form" onSubmit={handleCreate}>
        <input
          className="sidebar__input"
          type="text"
          placeholder="New workspace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
          aria-label="New workspace name"
        />
        <button
          className="sidebar__add-button"
          type="submit"
          disabled={creating || !name.trim()}
          aria-label="Create workspace"
        >
          +
        </button>
      </form>
      {createError && (
        <p className="sidebar__hint sidebar__hint--error">{createError}</p>
      )}

      <div className="sidebar__footer">
        <span className="sidebar__user">{user?.username}</span>
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
