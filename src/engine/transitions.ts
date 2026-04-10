import type { ZoomMode, TimelineMode } from './types';
import { rootAttrs } from './root-state';
import type { ScrollEngine } from './scroll-engine';

const ZOOM_TRANSITIONS: Record<ZoomMode, ZoomMode[]> = {
  idle: ['entering'],
  entering: ['zoomed', 'exiting'],
  zoomed: ['exiting'],
  exiting: ['idle'],
};

const TIMELINE_TRANSITIONS: Record<TimelineMode, TimelineMode[]> = {
  collapsed: ['expanding'],
  expanding: ['expanded', 'contracting'],
  expanded: ['contracting'],
  contracting: ['collapsed'],
};

const DEBUG = true;

export function transitionZoomMode(
  engine: ScrollEngine,
  to: ZoomMode
): boolean {
  const from = engine.state.zoomMode;
  if (from === to) return true;
  if (!ZOOM_TRANSITIONS[from].includes(to)) {
    if (DEBUG) {
      console.warn(`[transitions] illegal zoomMode ${from} → ${to}`);
    }
    return false;
  }
  engine.state.zoomMode = to;
  rootAttrs.setZoomMode(to);
  // Zoom mode changes may reveal or hide the timeline
  engine.refreshTimelineReveal();
  engine.notifyDiscreteChange();
  return true;
}

export function transitionTimelineMode(
  engine: ScrollEngine,
  to: TimelineMode
): boolean {
  const from = engine.state.timelineMode;
  if (from === to) return true;
  if (!TIMELINE_TRANSITIONS[from].includes(to)) {
    if (DEBUG) {
      console.warn(`[transitions] illegal timelineMode ${from} → ${to}`);
    }
    return false;
  }
  engine.state.timelineMode = to;
  rootAttrs.setTimelineMode(to);
  engine.notifyDiscreteChange();
  return true;
}
