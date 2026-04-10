import { useSyncExternalStore } from 'react';
import { scrollEngine } from '@/engine/scroll-engine';
import type { EngineState } from '@/engine/types';

/**
 * Selector-based engine hook. Use with primitive selectors only
 * (e.g. s => s.activeChapterId). Returning objects breaks React's bailout
 * and causes infinite re-renders.
 */
export function useEngine<T>(selector: (s: EngineState) => T): T {
  return useSyncExternalStore(
    scrollEngine.subscribe,
    () => selector(scrollEngine.getSnapshot()),
    () => selector(scrollEngine.getSnapshot())
  );
}
