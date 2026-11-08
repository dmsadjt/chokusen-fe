import { useEffect, useState, type FormEvent } from 'react';
import { API_BASE } from './lib/api';
import InviteMember from './InviteMember';
import type { Channel } from './types';
import './ChannelPanel.css';

type Status = 'loading' | 'loaded' | 'error';

type ChannelPanelProps = {
  workspaceId: string;
  selectedChannelId: string | null;
  onSelect: (channelId: string) => void;
};

function ChannelPanel({ workspaceId, selectedChannelId, onSelect }: ChannelPanelProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadChannels = () => {
    setStatus('loading');
    return fetch(`${API_BASE}/workspaces/${workspaceId}/channels`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load channels');
        return res.json();
      })
      .then((data: Channel[]) => {
        setChannels(data);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  };

  useEffect(() => {
    setName('');
    setIsPrivate(false);
    setCreateError('');
    void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: trimmed, isPrivate }),
      });

      if (!res.ok) {
        throw new Error('Failed to create channel');
      }

      setName('');
      setIsPrivate(false);
      await loadChannels();
    } catch {
      setCreateError("Couldn't create channel");
    } finally {
      setCreating(false);
    }
  };

  return (
    <nav className="channel-panel" aria-label="Channels">
      <h3 className="channel-panel__heading">Channels</h3>

      {status === 'loading' && <p className="channel-panel__hint">Loading…</p>}
      {status === 'error' && (
        <p className="channel-panel__hint channel-panel__hint--error">
          Couldn't load channels
        </p>
      )}
      {status === 'loaded' && channels.length === 0 && (
        <p className="channel-panel__hint">No channels yet</p>
      )}
      {status === 'loaded' && channels.length > 0 && (
        <ul className="channel-panel__list">
          {channels.map((ch) => (
            <li key={ch.channelId}>
              <button
                type="button"
                className={`channel-panel__item${ch.channelId === selectedChannelId ? ' channel-panel__item--active' : ''}`}
                onClick={() => onSelect(ch.channelId)}
              >
                <span className="channel-panel__hash">{ch.isPrivate ? '🔒' : '#'}</span>
                {ch.channelName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="channel-panel__form" onSubmit={handleCreate}>
        <input
          className="channel-panel__input"
          type="text"
          placeholder="New channel"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
          aria-label="New channel name"
        />
        <label className="channel-panel__checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={creating}
          />
          Private
        </label>
        <button
          className="channel-panel__add-button"
          type="submit"
          disabled={creating || !name.trim()}
        >
          Add
        </button>
      </form>
      {createError && (
        <p className="channel-panel__hint channel-panel__hint--error">{createError}</p>
      )}

      <InviteMember workspaceId={workspaceId} />
    </nav>
  );
}

export default ChannelPanel;
