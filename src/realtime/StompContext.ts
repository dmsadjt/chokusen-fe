import { createContext } from 'react';

export type StompContextValue = {
  subscribe: (destination: string, handler: (body: string) => void) => () => void;
  publish: (destination: string, body: string) => boolean;
};

export const StompContext = createContext<StompContextValue | null>(null);
