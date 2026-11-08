import { useEffect, useState, type FormEvent } from 'react';
import { API_BASE } from './lib/api';
import type { Workspace } from './types';
import './Sidebar.css';

type Status = 'loading' | 'loaded' | 'error';

type SidebarProps = {
  selectedWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
};

function Sidebar({ selectedWorkspaceId, onSelect }: SidebarProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  return (
    <nav className="sidebar" aria-label="Workspaces">
      <h2 className="sidebar__heading">Workspaces</h2>

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
    </nav>
  );
}

export default Sidebar;
