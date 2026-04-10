import { useEngine } from './useEngine';

/**
 * Thin wrapper around useEngine for the reduced-motion flag.
 * The engine's state is the source of truth (it reads matchMedia on init).
 */
export function useReducedMotion(): boolean {
  return useEngine((s) => s.prefersReducedMotion);
}
