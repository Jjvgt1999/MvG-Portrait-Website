import type { ScrollEngine } from './scroll-engine';
import {
  transitionZoomMode,
  transitionTimelineMode,
} from './transitions';
import { rootAttrs } from './root-state';
import { getViewportH } from './viewport';

/**
 * Internal phase machine for zoom enter/exit.
 * See plan: Phase 0 → 1 → 2 → 3 → 4 → 5 (enter), and inverse for exit.
 */
type Phase =
  | 'idle'
  | 'enter-overlay-masking-in'
  | 'enter-dom-swap'
  | 'enter-springing-in'
  | 'enter-overlay-unmasking'
  | 'exit-overlay-masking-in'
  | 'exit-springing-out'
  | 'exit-overlay-unmasking';

const OVERLAY_SAFETY_TIMEOUT_MS = 280;
const MINI_MARGIN_PX = 120;
const ENTER_UNMASK_THRESHOLD = 0.3; // reveal after 30% of spring distance
const EXIT_UNMASK_THRESHOLD = 0.7; // reveal after 70% of spring back

export class ZoomController {
  private phase: Phase = 'idle';
  private savedScrollY = 0;
  private currentMiniScale = 1;
  private enterStartScale = 1;
  private exitStartScale = 1;
  private exitTargetY = 0;
  private overlayTransitionDone = false;
  private overlayTimeoutId: number | null = null;
  private overlayListener: ((e: TransitionEvent) => void) | null = null;

  constructor(
    private engine: ScrollEngine,
    private zoomStage: HTMLElement,
    private overlay: HTMLElement
  ) {}

  destroy(): void {
    this.cleanupOverlayWatch();
    this.stripZoomStyles();
    this.removeScrollBlockers();
    this.phase = 'idle';
  }

  // ============================================================
  // Enter flow
  // ============================================================
  enter(): void {
    if (this.engine.state.zoomMode !== 'idle') return;
    if (window.innerWidth < 768) return;

    const reducedMotion = this.engine.state.prefersReducedMotion;

    // Phase 0: transition into entering mode
    if (!transitionZoomMode(this.engine, 'entering')) return;
    transitionTimelineMode(this.engine, 'expanding');

    if (reducedMotion) {
      // Skip overlay fade and spring animation entirely
      this.performDomSwap();
      this.engine.zoomScaleSpring.jumpTo(this.currentMiniScale);
      this.engine.timelineWidthSpring.jumpTo(
        this.engine.getTimelineWidthExpanded()
      );
      this.engine.labelOpacitySpring.jumpTo(1);
      this.engine.labelScaleSpring.jumpTo(1.02);
      transitionZoomMode(this.engine, 'zoomed');
      transitionTimelineMode(this.engine, 'expanded');
      this.phase = 'idle';
      return;
    }

    // Phase 1: overlay masking in
    this.phase = 'enter-overlay-masking-in';
    this.overlayTransitionDone = false;
    this.watchOverlayTransitionEnd(() => {
      this.overlayTransitionDone = true;
      if (this.phase === 'enter-overlay-masking-in') {
        this.performEnterPhase2();
      }
    });
  }

  private performEnterPhase2(): void {
    // Phase 2: DOM swap while overlay is opaque
    this.performDomSwap();
    this.addScrollBlockers();

    // Start spring animations
    this.enterStartScale = this.engine.zoomScaleSpring.get();
    this.engine.zoomScaleSpring.setTarget(this.currentMiniScale);
    this.engine.timelineWidthSpring.setTarget(
      this.engine.getTimelineWidthExpanded()
    );
    this.engine.labelOpacitySpring.setTarget(1);
    this.engine.labelScaleSpring.setTarget(1.02);

    this.phase = 'enter-springing-in';
    this.engine.kick();
  }

  private performDomSwap(): void {
    this.savedScrollY = window.scrollY;
    const vh = getViewportH();
    const docH = this.zoomStage.offsetHeight;
    if (docH <= 0) {
      this.currentMiniScale = 1;
      return;
    }
    this.currentMiniScale = Math.min(
      0.6,
      Math.max(0.08, (vh - MINI_MARGIN_PX) / docH)
    );

    // Switch to fixed positioning; translate compensates for current scrollY
    this.zoomStage.style.position = 'fixed';
    this.zoomStage.style.top = '0';
    this.zoomStage.style.left = '50%';
    this.zoomStage.style.width = '100%';
    this.zoomStage.style.maxWidth = '100vw';
    this.zoomStage.style.transformOrigin = 'top center';
    this.zoomStage.style.transform = `translate(-50%, ${-this.savedScrollY}px) scale(1)`;
    this.zoomStage.style.willChange = 'transform';
    this.zoomStage.style.pointerEvents = 'none';
  }

  // ============================================================
  // Exit flow
  // ============================================================
  exit(): void {
    if (this.engine.state.zoomMode !== 'zoomed') return;
    this.exitTargetY = this.savedScrollY;
    this.beginExit();
  }

  exitToChapter(chapterId: string): void {
    if (this.engine.state.zoomMode !== 'zoomed') return;
    this.exitTargetY = this.engine.chapterStartY(chapterId);
    this.beginExit();
  }

  exitToPage(pageId: string): void {
    if (this.engine.state.zoomMode !== 'zoomed') return;
    this.exitTargetY = this.engine.pageStartY(pageId);
    this.beginExit();
  }

  private beginExit(): void {
    const reducedMotion = this.engine.state.prefersReducedMotion;

    if (!transitionZoomMode(this.engine, 'exiting')) return;
    transitionTimelineMode(this.engine, 'contracting');

    if (reducedMotion) {
      this.performExitPhase1();
      this.engine.zoomScaleSpring.jumpTo(1);
      this.engine.timelineWidthSpring.jumpTo(
        this.engine.getTimelineWidthCollapsed()
      );
      this.engine.labelOpacitySpring.jumpTo(0);
      this.engine.labelScaleSpring.jumpTo(1);
      this.finishExit();
      return;
    }

    this.phase = 'exit-overlay-masking-in';
    this.overlayTransitionDone = false;
    this.watchOverlayTransitionEnd(() => {
      this.overlayTransitionDone = true;
      if (this.phase === 'exit-overlay-masking-in') {
        this.performExitPhase1();
      }
    });
  }

  private performExitPhase1(): void {
    // Phase 1: silent pre-scroll to target (ZoomStage is fixed, no visual change)
    const clampedTarget = Math.max(
      0,
      Math.min(
        this.exitTargetY,
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      )
    );
    window.scrollTo(0, clampedTarget);
    this.exitTargetY = clampedTarget;

    // Update transform translate to land at target on exit
    const currentScale = this.engine.zoomScaleSpring.get();
    this.zoomStage.style.transform = `translate(-50%, ${-clampedTarget}px) scale(${currentScale})`;

    // Start spring animations back
    this.exitStartScale = currentScale;
    this.engine.zoomScaleSpring.setTarget(1);
    this.engine.timelineWidthSpring.setTarget(
      this.engine.getTimelineWidthCollapsed()
    );
    this.engine.labelOpacitySpring.setTarget(0);
    this.engine.labelScaleSpring.setTarget(1);

    this.phase = 'exit-springing-out';
    this.engine.kick();
  }

  // ============================================================
  // Phase advancement (called from scroll-engine rAF tick)
  // ============================================================
  advancePhases(): void {
    if (this.phase === 'idle') return;

    if (this.phase === 'enter-springing-in') {
      // Check unmask threshold
      const totalDist = Math.abs(
        this.currentMiniScale - this.enterStartScale
      );
      const travelled = Math.abs(
        this.engine.zoomScaleSpring.get() - this.enterStartScale
      );
      const progress = totalDist > 0.0001 ? travelled / totalDist : 1;
      if (progress >= ENTER_UNMASK_THRESHOLD) {
        this.phase = 'enter-overlay-unmasking';
        this.overlayTransitionDone = false;
        rootAttrs.setOverlayPhase('unmasking');
        this.watchOverlayTransitionEnd(() => {
          this.overlayTransitionDone = true;
          this.tryFinishEnter();
        });
      }
    } else if (this.phase === 'enter-overlay-unmasking') {
      this.tryFinishEnter();
    } else if (this.phase === 'exit-springing-out') {
      const totalDist = Math.abs(1 - this.exitStartScale);
      const travelled = Math.abs(
        this.engine.zoomScaleSpring.get() - this.exitStartScale
      );
      const progress = totalDist > 0.0001 ? travelled / totalDist : 1;
      if (progress >= EXIT_UNMASK_THRESHOLD) {
        this.phase = 'exit-overlay-unmasking';
        this.overlayTransitionDone = false;
        rootAttrs.setOverlayPhase('unmasking');
        this.watchOverlayTransitionEnd(() => {
          this.overlayTransitionDone = true;
          this.tryFinishExit();
        });
      }
    } else if (this.phase === 'exit-overlay-unmasking') {
      this.tryFinishExit();
    }
  }

  private tryFinishEnter(): void {
    if (!this.engine.zoomScaleSpring.isAtRest()) return;
    if (!this.overlayTransitionDone) return;
    // Phase 5: settled
    rootAttrs.setOverlayPhase(null);
    this.cleanupOverlayWatch();
    transitionZoomMode(this.engine, 'zoomed');
    transitionTimelineMode(this.engine, 'expanded');
    this.phase = 'idle';
  }

  private tryFinishExit(): void {
    if (!this.engine.zoomScaleSpring.isAtRest()) return;
    if (!this.overlayTransitionDone) return;
    this.finishExit();
  }

  private finishExit(): void {
    rootAttrs.setOverlayPhase(null);
    this.cleanupOverlayWatch();
    this.stripZoomStyles();
    this.removeScrollBlockers();
    transitionZoomMode(this.engine, 'idle');
    transitionTimelineMode(this.engine, 'collapsed');
    this.phase = 'idle';
    // Run any deferred measure
    this.engine.onModeIdle();
  }

  // ============================================================
  // Apply scale — called from the engine's tick loop
  // ============================================================
  applyScale(scale: number): void {
    if (this.engine.state.zoomMode === 'idle' && this.phase === 'idle') return;
    // Determine translate Y based on current phase
    let translateY: number;
    if (
      this.phase === 'exit-springing-out' ||
      this.phase === 'exit-overlay-unmasking'
    ) {
      translateY = -this.exitTargetY;
    } else {
      translateY = -this.savedScrollY;
    }
    this.zoomStage.style.transform = `translate(-50%, ${translateY}px) scale(${scale})`;
  }

  // ============================================================
  // Scroll blockers (zoom mode)
  // ============================================================
  private wheelBlocker = (e: WheelEvent): void => {
    e.preventDefault();
  };
  private touchBlocker = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault();
  };
  private keyBlocker = (e: KeyboardEvent): void => {
    const blocked = [
      'ArrowDown',
      'ArrowUp',
      'PageDown',
      'PageUp',
      'Home',
      'End',
      ' ',
      'Spacebar',
    ];
    if (blocked.includes(e.key)) e.preventDefault();
  };

  private blockersActive = false;

  private addScrollBlockers(): void {
    if (this.blockersActive) return;
    window.addEventListener('wheel', this.wheelBlocker, { passive: false });
    window.addEventListener('touchmove', this.touchBlocker, { passive: false });
    window.addEventListener('keydown', this.keyBlocker);
    this.blockersActive = true;
  }

  private removeScrollBlockers(): void {
    if (!this.blockersActive) return;
    window.removeEventListener('wheel', this.wheelBlocker);
    window.removeEventListener('touchmove', this.touchBlocker);
    window.removeEventListener('keydown', this.keyBlocker);
    this.blockersActive = false;
  }

  private stripZoomStyles(): void {
    this.zoomStage.style.position = '';
    this.zoomStage.style.top = '';
    this.zoomStage.style.left = '';
    this.zoomStage.style.width = '';
    this.zoomStage.style.maxWidth = '';
    this.zoomStage.style.transform = '';
    this.zoomStage.style.transformOrigin = '';
    this.zoomStage.style.willChange = '';
    this.zoomStage.style.pointerEvents = '';
  }

  // ============================================================
  // Overlay transitionend watcher with safety timeout
  // ============================================================
  private watchOverlayTransitionEnd(cb: () => void): void {
    this.cleanupOverlayWatch();
    let fired = false;
    const handler = (e: TransitionEvent): void => {
      if (e.propertyName !== 'opacity') return;
      if (fired) return;
      fired = true;
      this.cleanupOverlayWatch();
      cb();
    };
    this.overlayListener = handler;
    this.overlay.addEventListener('transitionend', handler);
    this.overlayTimeoutId = window.setTimeout(() => {
      if (fired) return;
      fired = true;
      this.cleanupOverlayWatch();
      cb();
    }, OVERLAY_SAFETY_TIMEOUT_MS);
  }

  private cleanupOverlayWatch(): void {
    if (this.overlayListener) {
      this.overlay.removeEventListener('transitionend', this.overlayListener);
      this.overlayListener = null;
    }
    if (this.overlayTimeoutId !== null) {
      clearTimeout(this.overlayTimeoutId);
      this.overlayTimeoutId = null;
    }
  }
}
