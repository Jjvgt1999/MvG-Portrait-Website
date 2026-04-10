import type { ZoomMode, TimelineMode } from './types';

/**
 * Centralized documentElement mutations. Nothing outside the engine
 * should touch CSS custom properties or root data attrs directly.
 */
const root = () => document.documentElement;

export const rootCSS = {
  setScrollY: (y: number): void => {
    root().style.setProperty('--scroll-y', y.toString());
  },
  setPlayhead: (p: number): void => {
    root().style.setProperty('--playhead', p.toFixed(4));
  },
  setZoomScale: (s: number): void => {
    root().style.setProperty('--zoom-scale', s.toFixed(4));
  },
  setTimelineWidth: (w: number): void => {
    root().style.setProperty('--timeline-width-px', w.toFixed(1));
  },
  setLabelOpacity: (o: number): void => {
    root().style.setProperty('--label-opacity', o.toFixed(3));
  },
  setLabelScale: (s: number): void => {
    root().style.setProperty('--label-scale', s.toFixed(3));
  },
  setViewportH: (h: number): void => {
    root().style.setProperty('--viewport-h', `${h}px`);
  },
};

export const rootAttrs = {
  setZoomMode: (m: ZoomMode): void => {
    root().dataset.zoomMode = m;
  },
  setTimelineMode: (m: TimelineMode): void => {
    root().dataset.timelineMode = m;
  },
  setOverlayPhase: (p: string | null): void => {
    if (p) root().dataset.overlayPhase = p;
    else delete root().dataset.overlayPhase;
  },
  setChapter: (id: string): void => {
    root().dataset.chapter = id;
  },
  setPage: (id: string): void => {
    root().dataset.page = id;
  },
  setChapterBg: (bg: 'paper' | 'ink' | 'dust'): void => {
    root().dataset.chapterBg = bg;
  },
  setScrollDirection: (d: 'up' | 'down' | 'idle'): void => {
    root().dataset.scrollDirection = d;
  },
  setReducedMotion: (r: boolean): void => {
    root().dataset.reducedMotion = r ? 'true' : 'false';
  },
  setDebug: (d: boolean): void => {
    root().dataset.debug = d ? 'true' : 'false';
  },
  setPastHero: (v: boolean): void => {
    root().dataset.pastHero = v ? 'true' : 'false';
  },
  setTimelineReveal: (v: boolean): void => {
    root().dataset.timelineReveal = v ? 'true' : 'false';
  },
  setHeaderTheme: (theme: 'dark-surface' | 'light-surface'): void => {
    root().dataset.headerTheme = theme;
  },
};
