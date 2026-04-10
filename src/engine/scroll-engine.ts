import type {
  EngineState,
  ChapterGeometry,
  SurfaceRegion,
  InvalidationReason,
  TimelineFrameState,
} from './types';
import { SURFACE_COLORS, SURFACE_FG, SURFACE_CHAPTER } from './header-theme';
import type { HeaderSurface } from './header-theme';
import { Spring } from './spring';
import { ScrollController } from './scroll-controller';
import { ZoomController } from './zoom-controller';
import { TimelineEngine } from './timeline/timeline-engine';
import type { TimelineRefs } from './timeline/timeline-engine';
import { DebugLayer } from './debug-layer';
import { rootCSS, rootAttrs } from './root-state';
import { measureGeometry } from './layout-measurements';
import { watchViewport, getViewportH, getViewportW } from './viewport';
import { playheadN, activeReferenceN, clamp01 } from './normalize';

const TIMELINE_WIDTH_COLLAPSED = 48;
const TIMELINE_WIDTH_EXPANDED_VW = 0.22;
const SCROLL_IDLE_MS = 200;

type InitParams = {
  zoomStage: HTMLElement;
  content: HTMLElement;
  overlay: HTMLElement;
  timelineRefs: TimelineRefs;
};

function makeInitialState(): EngineState {
  const vh = typeof window !== 'undefined' ? getViewportH() : 800;
  const vw = typeof window !== 'undefined' ? getViewportW() : 1200;
  return {
    rawScrollY: 0,
    viewportW: vw,
    viewportH: vh,
    docHeight: 0,
    playheadRaw: 0,
    activeChapterId: '',
    activePageId: '',
    chapterProgress: 0,
    pageProgress: 0,
    zoomMode: 'idle',
    timelineMode: 'collapsed',
    zoomScale: 1,
    scrollDirection: 'idle',
    scrollDirectionLastY: 0,
    scrollDirectionIdleTimer: 0,
    prefersReducedMotion: false,
    scrubbing: false,
    pastHero: false,
    scrollActive: false,
    hoveringRightEdge: false,
    timelineReveal: false,
    headerSurface: 'paper',
    headerTopSurface: 'paper',
    debug: false,
  };
}

export class ScrollEngine {
  state: EngineState = makeInitialState();
  chapters: ChapterGeometry[] = [];
  /** Measured surface regions for header theme detection. Independent from chapters. */
  surfaceRegions: SurfaceRegion[] = [];

  // Header DOM ref caches (set on init + resize, NOT queried per frame)
  private occluderEl: HTMLElement | null = null;
  private cachedHeaderTotalH = 48;
  private cachedDPR = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  private lastHeaderVars: Record<string, string> = {};

  /**
   * Visual cutline calibration offset (pixels).
   * The actual visible line where page content disappears behind the header
   * mask may differ from cachedHeaderTotalH by a few pixels due to safe-area
   * insets, sub-pixel rendering, or container padding. This offset corrects
   * for that delta. Tune visually with Shift+D debug lines:
   *   red  = header zone bottom (cachedHeaderTotalH)
   *   cyan = surface cutline (cachedHeaderTotalH + this offset)
   *   green = computed split boundary
   * When cyan aligns with the actual content edge, the value is correct.
   */
  private visualCutlineOffsetPx = 0;

  /** The real visible cutline in viewport-space (px from viewport top). */
  get surfaceCutlinePx(): number {
    return this.cachedHeaderTotalH + this.visualCutlineOffsetPx;
  }

  /** Expose header total height for debug layer. */
  get headerTotalHeightPx(): number {
    return this.cachedHeaderTotalH;
  }

  // Springs
  readonly playheadSpring = new Spring(0, 180, 28);
  readonly activeSegmentStartSpring = new Spring(0, 170, 30);
  readonly activeSegmentEndSpring = new Spring(0, 170, 22);
  readonly zoomScaleSpring = new Spring(1, 120, 22);
  readonly timelineWidthSpring = new Spring(TIMELINE_WIDTH_COLLAPSED, 160, 24);
  readonly labelOpacitySpring = new Spring(0, 150, 24);
  readonly labelScaleSpring = new Spring(1, 180, 26);

  // Controllers
  readonly scrollController = new ScrollController();
  zoomController!: ZoomController;
  timelineEngine!: TimelineEngine;
  debugLayer!: DebugLayer;

  // DOM refs
  private contentEl: HTMLElement | null = null;

  // rAF
  private rafId: number | null = null;
  private lastTime = 0;

  // Pub/sub
  private subscribers = new Set<() => void>();
  private discreteKey = '';

  // Scroll direction tracking
  private scrollIdleTimeoutId: number | null = null;
  // Scroll-active (reveal trigger) tracking — stays true for 1500ms after scroll
  private scrollActiveTimeoutId: number | null = null;
  // Right-edge hover detection threshold (90% of viewport width from left)
  private static readonly RIGHT_EDGE_THRESHOLD_FRAC = 0.9;
  private static readonly SCROLL_ACTIVE_MS = 1500;

  // Measure invalidation
  private pendingMeasureReason: InvalidationReason | null = null;
  private measureDebounceTimer: number | null = null;
  private imageLoadDebounceTimer: number | null = null;

  // Lifecycle guards
  private initialized = false;
  private viewportUnwatch: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private wheelCancelListener: ((e: WheelEvent) => void) | null = null;
  private touchCancelListener: ((e: TouchEvent) => void) | null = null;
  private fontsReadyListener: (() => void) | null = null;
  private debugKeyListener: ((e: KeyboardEvent) => void) | null = null;
  private escapeListener: ((e: KeyboardEvent) => void) | null = null;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private pointerLeaveListener: (() => void) | null = null;

  async init(params: InitParams): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.contentEl = params.content;

    // Prefers-reduced-motion detection
    this.state.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    rootAttrs.setReducedMotion(this.state.prefersReducedMotion);
    if (this.state.prefersReducedMotion) {
      // Tune springs to snap instantly
      this.playheadSpring.setPhysics(10000, 300);
      this.activeSegmentStartSpring.setPhysics(10000, 300);
      this.activeSegmentEndSpring.setPhysics(10000, 300);
      this.zoomScaleSpring.setPhysics(10000, 300);
      this.timelineWidthSpring.setPhysics(10000, 300);
      this.labelOpacitySpring.setPhysics(10000, 300);
      this.labelScaleSpring.setPhysics(10000, 300);
    }

    // Controllers
    this.zoomController = new ZoomController(this, params.zoomStage, params.overlay);
    this.timelineEngine = new TimelineEngine(this, params.timelineRefs);
    this.debugLayer = new DebugLayer(this, params.content);

    // Initial CSS vars (before first tick)
    rootCSS.setViewportH(this.state.viewportH);
    rootCSS.setScrollY(0);
    rootCSS.setPlayhead(0);
    rootCSS.setZoomScale(1);
    rootCSS.setTimelineWidth(TIMELINE_WIDTH_COLLAPSED);
    rootCSS.setLabelOpacity(0);
    rootCSS.setLabelScale(1);
    rootAttrs.setZoomMode('idle');
    rootAttrs.setTimelineMode('collapsed');
    rootAttrs.setScrollDirection('idle');
    rootAttrs.setChapterBg('paper');
    rootAttrs.setHeaderTheme('light-surface');
    // Cache header DOM refs + measure geometry
    this.cacheHeaderDOMRefs();
    this.measureHeaderGeometry();
    // Set initial header CSS vars (paper surface, no boundary)
    const root = document.documentElement.style;
    const paperBg = SURFACE_COLORS['paper'];
    const paperFg = SURFACE_FG['paper'];
    const paperCh = SURFACE_CHAPTER['paper'];
    root.setProperty('--header-top-surface-bg', paperBg);
    root.setProperty('--header-bottom-surface-bg', paperBg);
    root.setProperty('--header-top-fg', paperFg);
    root.setProperty('--header-bottom-fg', paperFg);
    root.setProperty('--header-top-chapter', paperCh);
    root.setProperty('--header-bottom-chapter', paperCh);
    root.setProperty('--header-boundary-px-global', this.cachedHeaderTotalH + 'px');
    rootAttrs.setPastHero(false);
    rootAttrs.setTimelineReveal(false);

    // Wheel + touch cancellation of in-flight tweens (passive listeners)
    this.wheelCancelListener = (): void => {
      if (this.scrollController.isActive()) {
        this.scrollController.cancel();
      }
    };
    this.touchCancelListener = (): void => {
      if (this.scrollController.isActive()) {
        this.scrollController.cancel();
      }
    };
    window.addEventListener('wheel', this.wheelCancelListener, { passive: true });
    window.addEventListener('touchstart', this.touchCancelListener, { passive: true });

    // Escape key closes zoom
    this.escapeListener = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this.state.zoomMode === 'zoomed') {
        this.requestZoomExit();
      }
    };
    window.addEventListener('keydown', this.escapeListener);

    // Debug toggle: Shift + D
    this.debugKeyListener = (e: KeyboardEvent): void => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        this.state.debug = !this.state.debug;
        rootAttrs.setDebug(this.state.debug);
        this.debugLayer.refresh();
      }
    };
    window.addEventListener('keydown', this.debugKeyListener);

    // Native scroll listener (passive). The rAF tick reads window.scrollY each
    // frame, but an explicit listener ensures the rAF loop wakes up promptly.
    window.addEventListener('scroll', this.onNativeScroll, { passive: true });

    // Mouse-move listener for right-edge hover detection (timeline reveal)
    this.mouseMoveListener = (e: MouseEvent): void => {
      const frac = e.clientX / this.state.viewportW;
      const hovering = frac >= ScrollEngine.RIGHT_EDGE_THRESHOLD_FRAC;
      if (hovering !== this.state.hoveringRightEdge) {
        this.state.hoveringRightEdge = hovering;
        this.updateTimelineReveal();
      }
    };
    window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });

    // Pointer leaving the window — clear hover state
    this.pointerLeaveListener = (): void => {
      if (this.state.hoveringRightEdge) {
        this.state.hoveringRightEdge = false;
        this.updateTimelineReveal();
      }
    };
    document.addEventListener('mouseleave', this.pointerLeaveListener);

    // ResizeObserver on body for layout changes
    this.resizeObserver = new ResizeObserver(() => {
      this.invalidateMeasure('resize');
    });
    this.resizeObserver.observe(document.body);

    // visualViewport resize — filter soft chrome
    this.viewportUnwatch = watchViewport((next, kind) => {
      this.state.viewportH = next.h;
      this.state.viewportW = next.w;
      rootCSS.setViewportH(next.h);
      if (kind === 'layout') {
        this.invalidateMeasure('resize');
      }
    });

    // Fonts ready
    if (document.fonts && document.fonts.ready) {
      this.fontsReadyListener = (): void => {
        this.invalidateMeasure('font-load');
      };
      document.fonts.ready.then(this.fontsReadyListener);
    }

    // Image load listeners on current images
    this.attachImageLoadListeners();

    // Initial measure
    await this.invalidateMeasure('init');

    // Kick the loop once so initial CSS vars write
    this.kick();
  }

  destroy(): void {
    if (!this.initialized) return;
    this.initialized = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      // Also clear in case it was a setTimeout id (the two id spaces don't conflict
      // in practice but clearing both is harmless and idempotent)
      clearTimeout(this.rafId);
      this.rafId = null;
    }
    this.scrollController.cancel();

    window.removeEventListener('scroll', this.onNativeScroll);
    if (this.wheelCancelListener) {
      window.removeEventListener('wheel', this.wheelCancelListener);
      this.wheelCancelListener = null;
    }
    if (this.touchCancelListener) {
      window.removeEventListener('touchstart', this.touchCancelListener);
      this.touchCancelListener = null;
    }
    if (this.escapeListener) {
      window.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }
    if (this.debugKeyListener) {
      window.removeEventListener('keydown', this.debugKeyListener);
      this.debugKeyListener = null;
    }
    if (this.viewportUnwatch) {
      this.viewportUnwatch();
      this.viewportUnwatch = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
      this.mouseMoveListener = null;
    }
    if (this.pointerLeaveListener) {
      document.removeEventListener('mouseleave', this.pointerLeaveListener);
      this.pointerLeaveListener = null;
    }
    if (this.scrollActiveTimeoutId !== null) {
      clearTimeout(this.scrollActiveTimeoutId);
      this.scrollActiveTimeoutId = null;
    }
    if (this.measureDebounceTimer !== null) {
      clearTimeout(this.measureDebounceTimer);
      this.measureDebounceTimer = null;
    }
    if (this.imageLoadDebounceTimer !== null) {
      clearTimeout(this.imageLoadDebounceTimer);
      this.imageLoadDebounceTimer = null;
    }
    if (this.scrollIdleTimeoutId !== null) {
      clearTimeout(this.scrollIdleTimeoutId);
      this.scrollIdleTimeoutId = null;
    }

    this.timelineEngine?.destroy();
    this.zoomController?.destroy();
    this.debugLayer?.destroy();

    this.contentEl = null;
    this.chapters = [];
    this.state = makeInitialState();
    this.subscribers.clear();
  }

  // ============================================================
  // Pub/sub for React
  // ============================================================
  getSnapshot = (): EngineState => this.state;

  subscribe = (cb: () => void): (() => void) => {
    this.subscribers.add(cb);
    return (): void => {
      this.subscribers.delete(cb);
    };
  };

  notifyDiscreteChange(): void {
    const key = `${this.state.activeChapterId}|${this.state.activePageId}|${this.state.zoomMode}|${this.state.timelineMode}|${this.state.pastHero}|${this.state.timelineReveal}|${this.state.debug}|${this.state.scrubbing}`;
    if (key === this.discreteKey) return;
    this.discreteKey = key;
    // React may re-render; the snapshot reference hasn't changed but
    // useSyncExternalStore will call the selector again.
    for (const cb of this.subscribers) cb();
  }

  // ============================================================
  // Arbitration entry points
  // ============================================================

  async requestScrollTo(targetY: number, duration = 900): Promise<boolean> {
    if (this.state.zoomMode !== 'idle') return false;
    if (this.state.scrubbing) return false;
    const dur = this.state.prefersReducedMotion ? 0 : duration;
    const result = await this.scrollController.scrollToY(targetY, dur);
    return result;
  }

  scrollToChapter(chapterId: string): void {
    const c = this.chapters.find((ch) => ch.id === chapterId);
    if (!c) return;
    void this.requestScrollTo(c.startY);
  }

  scrollToPage(pageId: string): void {
    for (const c of this.chapters) {
      const p = c.pages.find((pg) => pg.id === pageId);
      if (p) {
        void this.requestScrollTo(p.startY);
        return;
      }
    }
  }

  chapterStartY(chapterId: string): number {
    const c = this.chapters.find((ch) => ch.id === chapterId);
    return c ? c.startY : 0;
  }

  pageStartY(pageId: string): number {
    for (const c of this.chapters) {
      const p = c.pages.find((pg) => pg.id === pageId);
      if (p) return p.startY;
    }
    return 0;
  }

  startScrubbing(): boolean {
    if (this.state.zoomMode === 'entering' || this.state.zoomMode === 'exiting') {
      return false;
    }
    if (this.scrollController.isActive()) {
      this.scrollController.cancel();
    }
    this.state.scrubbing = true;
    this.notifyDiscreteChange();
    return true;
  }

  setScrubTarget(y: number): void {
    if (!this.state.scrubbing) return;
    if (this.state.zoomMode === 'entering' || this.state.zoomMode === 'exiting') {
      return;
    }
    const clamped = Math.max(
      0,
      Math.min(
        y,
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      )
    );
    window.scrollTo(0, clamped);
  }

  endScrubbing(): void {
    if (!this.state.scrubbing) return;
    this.state.scrubbing = false;
    this.notifyDiscreteChange();
  }

  isScrubbing(): boolean {
    return this.state.scrubbing;
  }

  requestZoomEnter(): void {
    if (this.state.zoomMode !== 'idle') return;
    if (window.innerWidth < 768) return;
    if (this.scrollController.isActive()) this.scrollController.cancel();
    if (this.state.scrubbing) this.endScrubbing();
    this.zoomController.enter();
    this.kick();
  }

  requestZoomExit(): void {
    if (this.state.zoomMode !== 'zoomed') return;
    this.zoomController.exit();
    this.kick();
  }

  requestZoomExitToChapter(chapterId: string): void {
    if (this.state.zoomMode !== 'zoomed') return;
    this.zoomController.exitToChapter(chapterId);
    this.kick();
  }

  requestZoomExitToPage(pageId: string): void {
    if (this.state.zoomMode !== 'zoomed') return;
    this.zoomController.exitToPage(pageId);
    this.kick();
  }

  // ============================================================
  // Geometry & measurement
  // ============================================================

  async invalidateMeasure(reason: InvalidationReason): Promise<void> {
    if (!this.contentEl) return;
    if (this.state.zoomMode !== 'idle') {
      this.pendingMeasureReason = reason;
      return;
    }
    // Debounce all reasons except 'init'
    if (reason !== 'init') {
      if (this.measureDebounceTimer !== null) {
        clearTimeout(this.measureDebounceTimer);
      }
      this.measureDebounceTimer = window.setTimeout(() => {
        this.measureDebounceTimer = null;
        void this.performMeasure();
      }, 150);
      return;
    }
    await this.performMeasure();
  }

  private async performMeasure(): Promise<void> {
    if (!this.contentEl) return;
    if (this.state.zoomMode !== 'idle') {
      this.pendingMeasureReason = 'content';
      return;
    }
    const chapters = await measureGeometry(this.contentEl);
    this.chapters = chapters;
    this.surfaceRegions = this.measureSurfaceRegions();
    this.cacheHeaderDOMRefs();
    this.measureHeaderGeometry();
    this.state.docHeight = this.contentEl.offsetHeight;
    this.state.viewportH = getViewportH();
    this.state.viewportW = getViewportW();

    // Re-derive active chapter and re-target segment springs to current active
    this.updateDerived(window.scrollY);
    const active = this.chapters.find((c) => c.id === this.state.activeChapterId);
    if (active) {
      this.activeSegmentStartSpring.jumpTo(active.startN);
      this.activeSegmentEndSpring.jumpTo(active.endN);
    }

    // Timeline geometry needs to know about chapters now
    this.timelineEngine.onGeometryUpdated(this.chapters);
    this.debugLayer.onGeometryUpdated(this.chapters);

    this.pendingMeasureReason = null;
    this.kick();
  }

  onModeIdle(): void {
    if (this.pendingMeasureReason) {
      void this.performMeasure();
    }
  }

  // ============================================================
  // rAF loop
  // ============================================================

  kick(): void {
    // Always reconcile scroll position when kicked — handles cases where
    // window.scrollTo did not fire a scroll event (some headless environments).
    const sy = window.scrollY;
    if (sy !== this.state.rawScrollY) {
      const delta = sy - this.state.rawScrollY;
      this.state.rawScrollY = sy;
      this.updateDerived(sy);
      this.playheadSpring.setTarget(this.state.playheadRaw);
      this.updateScrollDirection(delta);
      rootCSS.setScrollY(sy);
    }
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    // Background tabs throttle rAF; fall back to setTimeout so the engine
    // remains responsive when the page is briefly hidden (e.g. headless preview).
    if (typeof document !== 'undefined' && document.hidden) {
      this.rafId = window.setTimeout(() => this.tick(performance.now()), 16) as unknown as number;
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private onNativeScroll = (): void => {
    // Read scroll synchronously inside the listener so the engine remains
    // responsive even in background tabs (where rAF/setTimeout are throttled).
    // The rAF loop still drives spring physics and other interpolation.
    const sy = window.scrollY;
    if (sy !== this.state.rawScrollY) {
      const delta = sy - this.state.rawScrollY;
      this.state.rawScrollY = sy;
      this.updateDerived(sy);
      this.playheadSpring.setTarget(this.state.playheadRaw);
      this.updateScrollDirection(delta);
      // Imperative writes for the values that should track scroll exactly
      rootCSS.setScrollY(sy);
    }
    this.kick();
  };

  private tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    let keep = false;

    // 1. Read scroll
    const sy = window.scrollY;
    if (sy !== this.state.rawScrollY) {
      const delta = sy - this.state.rawScrollY;
      this.state.rawScrollY = sy;
      this.updateDerived(sy);
      this.playheadSpring.setTarget(this.state.playheadRaw);
      this.updateScrollDirection(delta);
      keep = true;
    }

    // 2. Step springs
    if (this.playheadSpring.step(dt)) keep = true;
    if (this.activeSegmentStartSpring.step(dt)) keep = true;
    if (this.activeSegmentEndSpring.step(dt)) keep = true;
    if (this.zoomScaleSpring.step(dt)) keep = true;
    if (this.timelineWidthSpring.step(dt)) keep = true;
    if (this.labelOpacitySpring.step(dt)) keep = true;
    if (this.labelScaleSpring.step(dt)) keep = true;

    // 3. Zoom controller phase checks (spring-rest conditions)
    this.zoomController.advancePhases();

    // 4. Write CSS vars
    rootCSS.setScrollY(this.state.rawScrollY);
    rootCSS.setPlayhead(this.playheadSpring.get());
    rootCSS.setZoomScale(this.zoomScaleSpring.get());
    rootCSS.setTimelineWidth(this.timelineWidthSpring.get());
    rootCSS.setLabelOpacity(this.labelOpacitySpring.get());
    rootCSS.setLabelScale(this.labelScaleSpring.get());
    this.state.zoomScale = this.zoomScaleSpring.get();

    // 5. Timeline layers update (imperative SVG writes)
    const frameState: TimelineFrameState = {
      playheadRaw: this.state.playheadRaw,
      playheadSmoothed: this.playheadSpring.get(),
      segmentStart: this.activeSegmentStartSpring.get(),
      segmentEnd: this.activeSegmentEndSpring.get(),
      labelOpacity: this.labelOpacitySpring.get(),
      labelScale: this.labelScaleSpring.get(),
      zoomMode: this.state.zoomMode,
      timelineMode: this.state.timelineMode,
      activeChapterId: this.state.activeChapterId,
      activePageId: this.state.activePageId,
    };
    this.timelineEngine.update(frameState);

    // 6. Apply zoom scale to ZoomStage
    this.zoomController.applyScale(this.zoomScaleSpring.get());

    // 7. Discrete state change notify
    this.notifyDiscreteChange();

    // 8. Debug layer
    if (this.state.debug) {
      this.debugLayer.update();
    }

    // 9. Schedule or sleep
    if (keep) {
      if (typeof document !== 'undefined' && document.hidden) {
        this.rafId = window.setTimeout(
          () => this.tick(performance.now()),
          16
        ) as unknown as number;
      } else {
        this.rafId = requestAnimationFrame(this.tick);
      }
    } else {
      this.rafId = null;
      this.onModeIdle();
    }
  };

  private updateDerived(sy: number): void {
    const { docHeight, viewportH } = this.state;
    if (docHeight === 0) return;
    this.state.playheadRaw = playheadN(sy, docHeight);
    const ref = activeReferenceN(sy, viewportH, docHeight);

    // Past-hero threshold: gate for the chapter indicator + reveal.
    // Use 70% of viewport so the indicator fades in as the hero finishes
    // scrolling away rather than the moment the user touches the wheel.
    const shouldShow = sy > viewportH * 0.7;
    if (shouldShow !== this.state.pastHero) {
      this.state.pastHero = shouldShow;
      rootAttrs.setPastHero(shouldShow);
      this.updateTimelineReveal();
    }

    // Active chapter
    let newActiveChapter = this.chapters[0]?.id ?? '';
    let newActiveChapterObj = this.chapters[0];
    for (const c of this.chapters) {
      if (ref < c.endN) {
        newActiveChapter = c.id;
        newActiveChapterObj = c;
        break;
      }
      newActiveChapter = c.id;
      newActiveChapterObj = c;
    }

    if (newActiveChapter !== this.state.activeChapterId && newActiveChapterObj) {
      this.state.activeChapterId = newActiveChapter;
      rootAttrs.setChapter(newActiveChapter);
      // Retarget segment springs
      this.activeSegmentStartSpring.setTarget(newActiveChapterObj.startN);
      this.activeSegmentEndSpring.setTarget(newActiveChapterObj.endN);
      // Background attr for timeline contrast
      const bg = this.computeChapterBg(newActiveChapter);
      rootAttrs.setChapterBg(bg);
    }

    // Header surface: geometry-based detection at the header's bottom edge
    this.updateHeaderSurface();

    if (newActiveChapterObj) {
      const cLen = newActiveChapterObj.endN - newActiveChapterObj.startN;
      this.state.chapterProgress =
        cLen > 0
          ? clamp01((ref - newActiveChapterObj.startN) / cLen)
          : 0;

      // Active page
      let newActivePage = newActiveChapterObj.pages[0]?.id ?? '';
      let newActivePageObj = newActiveChapterObj.pages[0];
      for (const p of newActiveChapterObj.pages) {
        if (ref < p.endN) {
          newActivePage = p.id;
          newActivePageObj = p;
          break;
        }
        newActivePage = p.id;
        newActivePageObj = p;
      }
      if (newActivePage !== this.state.activePageId) {
        this.state.activePageId = newActivePage;
        rootAttrs.setPage(newActivePage);
      }
      if (newActivePageObj) {
        const pLen = newActivePageObj.endN - newActivePageObj.startN;
        this.state.pageProgress =
          pLen > 0 ? clamp01((ref - newActivePageObj.startN) / pLen) : 0;
      }
    }
  }

  /**
   * Measure all elements with `data-surface` and return sorted SurfaceRegion[].
   * Called on init and resize, NOT per frame.
   */
  private measureSurfaceRegions(): SurfaceRegion[] {
    if (!this.contentEl) return [];
    const els = this.contentEl.querySelectorAll<HTMLElement>('[data-surface]');
    const regions: SurfaceRegion[] = [];
    const scrollY = window.scrollY;
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const surface = el.dataset.surface as HeaderSurface;
      if (surface) {
        regions.push({
          id: el.id || el.dataset.chapterId || el.className,
          startPx: rect.top + scrollY,
          endPx: rect.bottom + scrollY,
          surface,
          el,
        });
      }
    });
    // Sort by startPx ascending — later DOM elements win ties via order
    regions.sort((a, b) => a.startPx - b.startPx);
    return regions;
  }

  /** Cache DOM refs for header elements. Called on init + geometry update. */
  private cacheHeaderDOMRefs(): void {
    this.occluderEl = document.getElementById('header-occluder');
  }

  /** Measure real rendered header geometry. Called on init + resize. */
  private measureHeaderGeometry(): void {
    this.cachedHeaderTotalH =
      this.occluderEl?.getBoundingClientRect().height ?? 48;
    this.cachedDPR = window.devicePixelRatio || 1;
  }

  /**
   * Boundary-driven header surface detection.
   *
   * Uses the **surface cutline** as the single source of truth for where
   * page content visually disappears behind the header mask. The cutline
   * accounts for any delta between abstract header geometry and the real
   * visible edge (safe-area, sub-pixel, container padding, etc.).
   *
   * Writes 8 CSS vars (only when values change).
   *
   * Refreshes cached positions of nearby surface regions each frame so
   * that both surfaceAtY() probes and boundary search use live data.
   * Without this, stale caches cause the engine to miss boundaries
   * entirely for several pixels, creating a visible "invisible bar"
   * where foreground elements disappear.
   */
  private updateHeaderSurface(): void {
    const h = this.cachedHeaderTotalH;
    const cutline = this.surfaceCutlinePx;
    const sy = this.state.rawScrollY;

    // ── Refresh nearby region positions ──
    // Only touch regions whose cached position is within ~200px of the
    // header zone. This is typically 2-3 elements — cheap per frame.
    const margin = 200;
    for (const region of this.surfaceRegions) {
      if (region.startPx > sy + h + margin) break; // sorted, done
      if (region.endPx < sy - margin) continue;
      const rect = region.el.getBoundingClientRect();
      region.startPx = rect.top + sy;
      region.endPx = rect.bottom + sy;
    }

    // Zone edges in document-space
    const zoneTop = sy;
    const zoneBottom = sy + cutline;

    // Surface at zone edges — now uses refreshed region positions
    const topSurface = this.surfaceAtY(zoneTop + 1);
    const bottomSurface = this.surfaceAtY(zoneBottom - 1);

    // Boundary detection: find where the surface changes within the zone.
    let boundaryOffsetPx = cutline; // default: no boundary
    if (topSurface !== bottomSurface) {
      for (const region of this.surfaceRegions) {
        if (region.startPx > zoneTop && region.startPx < zoneBottom) {
          boundaryOffsetPx = region.startPx - zoneTop;
          // Don't break: nested regions may override
        }
      }
    }

    // Clamp to valid ranges and snap to device-pixel grid.
    const dpr = this.cachedDPR;
    const globalBoundaryPx =
      Math.round(Math.max(0, Math.min(h, boundaryOffsetPx)) * dpr) / dpr;

    // Build var map — only write changed values.
    // Only global boundary is needed: both the occluder gradient AND
    // the foreground passes clip at the same global coordinate.
    const vars: Record<string, string> = {
      '--header-top-surface-bg': SURFACE_COLORS[topSurface],
      '--header-bottom-surface-bg': SURFACE_COLORS[bottomSurface],
      '--header-top-fg': SURFACE_FG[topSurface],
      '--header-bottom-fg': SURFACE_FG[bottomSurface],
      '--header-top-chapter': SURFACE_CHAPTER[topSurface],
      '--header-bottom-chapter': SURFACE_CHAPTER[bottomSurface],
      '--header-boundary-px-global': globalBoundaryPx.toFixed(3) + 'px',
    };
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(vars)) {
      if (this.lastHeaderVars[k] !== v) {
        root.setProperty(k, v);
        this.lastHeaderVars[k] = v;
      }
    }

    // Discrete state for React subscribers
    if (bottomSurface !== this.state.headerSurface) {
      this.state.headerSurface = bottomSurface;
      document.documentElement.dataset.headerSurface = bottomSurface;
    }
    this.state.headerTopSurface = topSurface;
  }

  /**
   * Find the surface at a given document Y position.
   * Walks ALL matching regions — later (nested) entries override parents.
   */
  private surfaceAtY(docY: number): HeaderSurface {
    let surface: HeaderSurface = 'paper';
    for (const region of this.surfaceRegions) {
      if (docY >= region.startPx && docY < region.endPx) {
        surface = region.surface;
        // Don't break — later (nested) regions override parent
      }
    }
    return surface;
  }

  private computeChapterBg(chapterId: string): 'paper' | 'ink' | 'dust' {
    // Alternating pattern based on chapter index
    const idx = this.chapters.findIndex((c) => c.id === chapterId);
    if (idx < 0) return 'paper';
    // Match ordering used by Chapter component's backgroundForIndex
    // intro=paper, early-years=paper, founding-gmp=ink, expansion=paper, legacy=ink, events=dust, credits=paper
    const map: Record<string, 'paper' | 'ink' | 'dust'> = {
      intro: 'paper',
      'opening-quote': 'ink',
      'early-years': 'paper',
      'founding-gmp': 'ink',
      expansion: 'paper',
      legacy: 'ink',
      events: 'dust',
      credits: 'paper',
    };
    return map[chapterId] ?? 'paper';
  }

  private updateScrollDirection(delta: number): void {
    const dir: 'up' | 'down' = delta > 0 ? 'down' : 'up';
    if (dir !== this.state.scrollDirection) {
      this.state.scrollDirection = dir;
      rootAttrs.setScrollDirection(dir);
    }
    // Reset idle timer
    if (this.scrollIdleTimeoutId !== null) {
      clearTimeout(this.scrollIdleTimeoutId);
    }
    this.scrollIdleTimeoutId = window.setTimeout(() => {
      this.state.scrollDirection = 'idle';
      rootAttrs.setScrollDirection('idle');
      this.scrollIdleTimeoutId = null;
    }, SCROLL_IDLE_MS);

    // Also mark scroll-active for the timeline reveal trigger
    this.markScrollActive();
  }

  private markScrollActive(): void {
    if (!this.state.scrollActive) {
      this.state.scrollActive = true;
      this.updateTimelineReveal();
    }
    if (this.scrollActiveTimeoutId !== null) {
      clearTimeout(this.scrollActiveTimeoutId);
    }
    this.scrollActiveTimeoutId = window.setTimeout(() => {
      this.state.scrollActive = false;
      this.scrollActiveTimeoutId = null;
      this.updateTimelineReveal();
    }, ScrollEngine.SCROLL_ACTIVE_MS);
  }

  refreshTimelineReveal(): void {
    this.updateTimelineReveal();
  }

  private updateTimelineReveal(): void {
    // Reveal the timeline when: (a) we're past the hero, AND
    // (b) user is scrolling OR hovering the right edge OR in zoom mode.
    const reveal =
      this.state.pastHero &&
      (this.state.scrollActive ||
        this.state.hoveringRightEdge ||
        this.state.zoomMode !== 'idle');
    if (reveal !== this.state.timelineReveal) {
      this.state.timelineReveal = reveal;
      rootAttrs.setTimelineReveal(reveal);
      this.notifyDiscreteChange();
    }
  }

  // ============================================================
  // Image load tracking
  // ============================================================

  attachImageLoadListeners(): void {
    if (!this.contentEl) return;
    const imgs = this.contentEl.querySelectorAll('img');
    const onLoad = (): void => {
      if (this.imageLoadDebounceTimer !== null) {
        clearTimeout(this.imageLoadDebounceTimer);
      }
      this.imageLoadDebounceTimer = window.setTimeout(() => {
        this.imageLoadDebounceTimer = null;
        void this.invalidateMeasure('image-load');
      }, 150);
    };
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
      }
    });
  }

  // Helpers exposed for controllers
  getTimelineWidthCollapsed(): number {
    return TIMELINE_WIDTH_COLLAPSED;
  }
  getTimelineWidthExpanded(): number {
    return Math.max(
      TIMELINE_WIDTH_COLLAPSED,
      window.innerWidth * TIMELINE_WIDTH_EXPANDED_VW
    );
  }
}

// Module-level singleton
export const scrollEngine = new ScrollEngine();

// Diagnostic global — remove for production
if (typeof window !== 'undefined') {
  (window as unknown as { __engine: ScrollEngine }).__engine = scrollEngine;
}
