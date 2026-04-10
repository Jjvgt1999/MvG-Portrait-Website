import { easeInOutCubic } from './easing';

/**
 * Dedicated controller for programmatic scroll tweens.
 * Cancellable via cancel(); resolves with true on completion, false on cancel.
 *
 * This is the ONLY place that tweens `window.scrollY` via requestAnimationFrame.
 * Scrub writes go through ScrollEngine.setScrubTarget; nothing else calls
 * window.scrollTo during normal operation.
 */
export class ScrollController {
  private rafId: number | null = null;
  private cancelled = false;
  private resolvePromise: ((value: boolean) => void) | null = null;

  scrollToY(targetY: number, duration = 900): Promise<boolean> {
    this.cancel();
    this.cancelled = false;
    const startY = window.scrollY;
    const clampedTarget = Math.max(
      0,
      Math.min(
        targetY,
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      )
    );

    if (duration <= 0) {
      window.scrollTo(0, clampedTarget);
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      const startTime = performance.now();

      const tick = (now: number): void => {
        if (this.cancelled) {
          this.rafId = null;
          this.resolvePromise?.(false);
          this.resolvePromise = null;
          return;
        }
        const t = Math.min(1, (now - startTime) / duration);
        const eased = easeInOutCubic(t);
        window.scrollTo(0, startY + (clampedTarget - startY) * eased);
        if (t < 1) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.rafId = null;
          this.resolvePromise?.(true);
          this.resolvePromise = null;
        }
      };

      this.rafId = requestAnimationFrame(tick);
    });
  }

  cancel(): void {
    this.cancelled = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = null;
    }
  }

  isActive(): boolean {
    return this.rafId !== null;
  }
}
