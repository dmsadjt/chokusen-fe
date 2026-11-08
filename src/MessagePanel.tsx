import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE, WS_URL } from './lib/api';
import { useAuth } from './auth/useAuth';
import type { ChannelMember, Message } from './types';
import './MessagePanel.css';

type Status = 'loading' | 'loaded' | 'error';

type MessagePanelProps = {
  channelId: string;
};

function MessagePanel({ channelId }: MessagePanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState('');
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setMessages([]);
    setUsernames({});

    fetch(`${API_BASE}/channels/${channelId}/members`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((members: ChannelMember[]) => {
        if (!cancelled) {
          setUsernames(
            Object.fromEntries(members.map((m) => [m.userId, m.username]))
          );
        }
      })
      .catch(() => {
        // best-effort — falls back to showing the raw sender id
      });

    fetch(`${API_BASE}/channels/${channelId}/messages`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load messages');
        return res.json();
      })
      .then((data: Message[]) => {
        if (!cancelled) {
          setMessages(data);
          setStatus('loaded');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/channel.${channelId}`, (frame) => {
          const incoming: Message = JSON.parse(frame.body);
          setMessages((prev) => [...prev, incoming]);
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => {
      cancelled = true;
      void client.deactivate();
      clientRef.current = null;
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !user || !clientRef.current?.connected) return;

    clientRef.current.publish({
      destination: `/app/chat.send/${channelId}`,
      body: JSON.stringify({ content: trimmed }),
    });
    setDraft('');
  };

  return (
    <div className="message-panel">
      <div className="message-panel__history">
        {status === 'loading' && <p className="message-panel__hint">Loading…</p>}
        {status === 'error' && (
          <p className="message-panel__hint message-panel__hint--error">
            Couldn't load messages
          </p>
        )}
        {status === 'loaded' && messages.length === 0 && (
          <p className="message-panel__hint">No messages yet — say hi</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`message-panel__bubble${msg.senderId === user?.userId ? ' message-panel__bubble--own' : ''}`}
          >
            <span className="message-panel__sender">
              {msg.senderId === user?.userId ? 'You' : usernames[msg.senderId] ?? msg.senderId.slice(0, 8)}
            </span>
            <p className="message-panel__content">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="message-panel__form" onSubmit={handleSend}>
        <input
          className="message-panel__input"
          type="text"
          placeholder="Message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Message"
        />
        <button className="message-panel__send-button" type="submit" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default MessagePanel;
