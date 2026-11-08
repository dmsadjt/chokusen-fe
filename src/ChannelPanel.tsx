import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from './auth/useAuth';
import { API_BASE } from './lib/api';
import { useStomp } from './realtime/useStomp';
import InviteMember from './InviteMember';
import type { Channel, Message, UnreadCount } from './types';
import './ChannelPanel.css';

type Status = 'loading' | 'loaded' | 'error';

type ChannelPanelProps = {
  workspaceId: string;
  selectedChannelId: string | null;
  onSelect: (channelId: string) => void;
};

function ChannelPanel({ workspaceId, selectedChannelId, onSelect }: ChannelPanelProps) {
  const { user } = useAuth();
  const { subscribe } = useStomp();
  const userId = user?.userId;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [unread, setUnread] = useState<Record<string, number>>({});
  const selectedRef = useRef(selectedChannelId);

  useEffect(() => {
    selectedRef.current = selectedChannelId;
  }, [selectedChannelId]);

  const loadChannels = () => {
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
    void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/workspaces/${workspaceId}/unread`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: UnreadCount[]) => {
        if (!cancelled) {
          setUnread(Object.fromEntries(list.map((u) => [u.channelId, u.unreadCount])));
        }
      })
      .catch(() => {
        // badges are best-effort; the channel list still works without them
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (status !== 'loaded') return;

    const unsubscribers = channels.map((ch) =>
      subscribe(`/topic/channel.${ch.channelId}`, (body) => {
        const msg: Message = JSON.parse(body);
        if (msg.senderId === userId || msg.channelId === selectedRef.current) return;
        setUnread((prev) => ({
          ...prev,
          [msg.channelId]: (prev[msg.channelId] ?? 0) + 1,
        }));
      })
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [channels, status, subscribe, userId]);

  const handleSelect = (channelId: string) => {
    setUnread((prev) => ({ ...prev, [channelId]: 0 }));
    onSelect(channelId);
  };

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
          {channels.map((ch) => {
            const count = unread[ch.channelId] ?? 0;
            return (
              <li key={ch.channelId}>
                <button
                  type="button"
                  className={`channel-panel__item${ch.channelId === selectedChannelId ? ' channel-panel__item--active' : ''}${count > 0 ? ' channel-panel__item--unread' : ''}`}
                  onClick={() => handleSelect(ch.channelId)}
                >
                  <span className="channel-panel__hash">{ch.isPrivate ? '🔒' : '#'}</span>
                  <span className="channel-panel__name">{ch.channelName}</span>
                  {count > 0 && (
                    <span className="channel-panel__badge" aria-label={`${count} unread`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
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
