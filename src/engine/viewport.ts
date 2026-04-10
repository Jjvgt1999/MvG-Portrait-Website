export function getViewportH(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

export function getViewportW(): number {
  return window.visualViewport?.width ?? window.innerWidth;
}

/**
 * Distinguish soft chrome resize (iOS URL bar show/hide — small height-only delta)
 * from a real layout change (width changes, big jumps).
 */
export function isSoftChromeResize(
  prev: { w: number; h: number },
  next: { w: number; h: number }
): boolean {
  if (prev.w !== next.w) return false;
  const dh = Math.abs(prev.h - next.h);
  return dh > 0 && dh <= 120;
}

export type ViewportResizeKind = 'layout' | 'chrome';

export function watchViewport(
  cb: (next: { w: number; h: number }, kind: ViewportResizeKind) => void
): () => void {
  let prev = { w: getViewportW(), h: getViewportH() };

  const handler = (): void => {
    const next = { w: getViewportW(), h: getViewportH() };
    const kind: ViewportResizeKind = isSoftChromeResize(prev, next)
      ? 'chrome'
      : 'layout';
    prev = next;
    cb(next, kind);
  };

  window.addEventListener('resize', handler);
  window.visualViewport?.addEventListener('resize', handler);

  return (): void => {
    window.removeEventListener('resize', handler);
    window.visualViewport?.removeEventListener('resize', handler);
  };
}
