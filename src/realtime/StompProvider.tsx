import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from '../lib/api';
import { StompContext, type StompContextValue } from './StompContext';

type Entry = {
  destination: string;
  handler: (body: string) => void;
  active: StompSubscription | null;
};

export function StompProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const entriesRef = useRef(new Set<Entry>());

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        entriesRef.current.forEach((entry) => {
          entry.active = client.subscribe(entry.destination, (frame) =>
            entry.handler(frame.body)
          );
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, []);

  const value = useMemo<StompContextValue>(
    () => ({
      subscribe(destination, handler) {
        const entry: Entry = { destination, handler, active: null };
        entriesRef.current.add(entry);

        const client = clientRef.current;
        if (client?.connected) {
          entry.active = client.subscribe(destination, (frame) =>
            handler(frame.body)
          );
        }

        return () => {
          try {
            entry.active?.unsubscribe();
          } catch {
            // connection already gone; nothing to unsubscribe from
          }
          entriesRef.current.delete(entry);
        };
      },
      publish(destination, body) {
        const client = clientRef.current;
        if (!client?.connected) return false;
        client.publish({ destination, body });
        return true;
      },
    }),
    []
  );

  return <StompContext.Provider value={value}>{children}</StompContext.Provider>;
}
