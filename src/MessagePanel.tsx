import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { API_BASE } from './lib/api';
import { useAuth } from './auth/useAuth';
import { useStomp } from './realtime/useStomp';
import type { Message, ReadReceipt } from './types';
import './MessagePanel.css';

type Status = 'loading' | 'loaded' | 'error';

type MessagePanelProps = {
  channelId: string;
};

const time = (iso: string) => new Date(iso).getTime();

function mergeMessages(first: Message[], second: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of first) byId.set(m.messageId, m);
  for (const m of second) byId.set(m.messageId, m);
  return [...byId.values()].sort((a, b) => time(a.sentAt) - time(b.sentAt));
}

function summarizeNames(names: string[]): string {
  const shown = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${shown} +${names.length - 3}` : shown;
}

function MessagePanel({ channelId }: MessagePanelProps) {
  const { user } = useAuth();
  const { subscribe, publish } = useStomp();
  const userId = user?.userId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState('');
  const [reads, setReads] = useState<Record<string, ReadReceipt>>({});
  const [dividerId, setDividerId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    fetch(`${API_BASE}/channels/${channelId}/read`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // read state is best-effort
    });
  }, [channelId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [messagesRes, readsRes] = await Promise.all([
          fetch(`${API_BASE}/channels/${channelId}/messages`, { credentials: 'include' }),
          fetch(`${API_BASE}/channels/${channelId}/reads`, { credentials: 'include' }),
        ]);
        if (!messagesRes.ok) throw new Error('Failed to load messages');

        const history: Message[] = await messagesRes.json();
        const receipts: ReadReceipt[] = readsRes.ok ? await readsRes.json() : [];
        if (cancelled) return;

        const receiptsByUser = Object.fromEntries(receipts.map((r) => [r.userId, r]));
        const myReadAt = userId ? receiptsByUser[userId]?.readAt : undefined;
        const firstUnread = history.find(
          (m) => m.senderId !== userId && (!myReadAt || time(m.sentAt) > time(myReadAt))
        );

        setMessages((live) => mergeMessages(history, live));
        setReads((live) => ({ ...receiptsByUser, ...live }));
        setDividerId(firstUnread?.messageId ?? null);
        setStatus('loaded');
        markRead();
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void load();

    const unsubscribeMessages = subscribe(`/topic/channel.${channelId}`, (body) => {
      const incoming: Message = JSON.parse(body);
      setMessages((prev) => mergeMessages(prev, [incoming]));
      if (incoming.senderId !== userId) markRead();
    });

    const unsubscribeReads = subscribe(`/topic/channel.${channelId}.reads`, (body) => {
      const receipt: ReadReceipt = JSON.parse(body);
      setReads((prev) => ({ ...prev, [receipt.userId]: receipt }));
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') markRead();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      unsubscribeMessages();
      unsubscribeReads();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [channelId, userId, subscribe, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !user) return;

    if (publish(`/app/chat.send/${channelId}`, JSON.stringify({ content: trimmed }))) {
      setDraft('');
    }
  };

  const lastOwn = [...messages].reverse().find((m) => m.senderId === userId);
  const seenBy = lastOwn
    ? Object.values(reads)
        .filter((r) => r.userId !== userId && time(r.readAt) >= time(lastOwn.sentAt))
        .map((r) => r.username)
    : [];

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
        {messages.map((msg) => {
          const own = msg.senderId === userId;
          return (
            <Fragment key={msg.messageId}>
              {msg.messageId === dividerId && (
                <div className="message-panel__divider">
                  <span>New messages</span>
                </div>
              )}
              <div className={`message-panel__bubble${own ? ' message-panel__bubble--own' : ''}`}>
                <span className="message-panel__sender">
                  {own ? 'You' : msg.senderUsername}
                </span>
                <p className="message-panel__content">{msg.content}</p>
              </div>
              {msg.messageId === lastOwn?.messageId && seenBy.length > 0 && (
                <div className="message-panel__seen">Seen by {summarizeNames(seenBy)}</div>
              )}
            </Fragment>
          );
        })}
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
