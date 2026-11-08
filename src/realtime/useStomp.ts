import { useContext } from 'react';
import { StompContext } from './StompContext';

export function useStomp() {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error('useStomp must be used inside <StompProvider>');
  }
  return ctx;
}
