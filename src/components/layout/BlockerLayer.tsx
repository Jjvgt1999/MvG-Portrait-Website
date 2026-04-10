import { scrollEngine } from '@/engine/scroll-engine';

/**
 * Full-viewport layer that catches pointer events when zoomMode === 'zoomed',
 * so clicks on the mini-map document body don't reach interactive content.
 * Only the timeline (z-40, above this layer) responds during zoom mode.
 *
 * Clicking the blocker exits zoom mode.
 */
export function BlockerLayer() {
  return (
    <div
      className="blocker-layer"
      aria-hidden
      onClick={() => scrollEngine.requestZoomExit()}
    />
  );
}
