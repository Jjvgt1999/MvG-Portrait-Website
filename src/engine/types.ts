import type { HeaderSurface } from './header-theme';

export type ZoomMode = 'idle' | 'entering' | 'zoomed' | 'exiting';
export type TimelineMode = 'collapsed' | 'expanding' | 'expanded' | 'contracting';

/** A measured region of the document with a known surface color.
 *  Independent from chapter geometry — includes image-break sub-sections. */
export type SurfaceRegion = {
  id: string;
  startPx: number;
  endPx: number;
  surface: HeaderSurface;
  /** DOM element reference for real-time position validation. */
  el: HTMLElement;
};

export type PageGeometry = {
  id: string;
  chapterId: string;
  index: number;
  title: string;
  startY: number;
  endY: number;
  startN: number;
  endN: number;
  lengthN: number;
};

export type ChapterGeometry = {
  id: string;
  label: string;
  title: string;
  startY: number;
  endY: number;
  startN: number;
  endN: number;
  lengthN: number;
  pages: PageGeometry[];
  labelYN: number;
};

export type EngineState = {
  rawScrollY: number;
  viewportW: number;
  viewportH: number;
  docHeight: number;
  playheadRaw: number;
  activeChapterId: string;
  activePageId: string;
  chapterProgress: number;
  pageProgress: number;
  zoomMode: ZoomMode;
  timelineMode: TimelineMode;
  zoomScale: number;
  scrollDirection: 'up' | 'down' | 'idle';
  scrollDirectionLastY: number;
  scrollDirectionIdleTimer: number;
  prefersReducedMotion: boolean;
  scrubbing: boolean;
  /** True when scrolled past the hero — gates the chapter indicator + reveal. */
  pastHero: boolean;
  /** True for ~1500ms after any user scroll event. */
  scrollActive: boolean;
  /** True while the pointer is in the right ~10% of the viewport. */
  hoveringRightEdge: boolean;
  /** Derived: pastHero && (scrollActive || hoveringRightEdge || zoomMode !== 'idle') */
  timelineReveal: boolean;
  /** Surface color behind the header area (probed at header bottom edge). */
  headerSurface: HeaderSurface;
  /** Surface color at the top edge of the header zone. */
  headerTopSurface: HeaderSurface;
  debug: boolean;
};

export type TimelineFrameState = {
  playheadRaw: number;
  playheadSmoothed: number;
  segmentStart: number;
  segmentEnd: number;
  labelOpacity: number;
  labelScale: number;
  zoomMode: ZoomMode;
  timelineMode: TimelineMode;
  activeChapterId: string;
  activePageId: string;
};

export type InvalidationReason =
  | 'resize'
  | 'font-load'
  | 'image-load'
  | 'content'
  | 'init';
