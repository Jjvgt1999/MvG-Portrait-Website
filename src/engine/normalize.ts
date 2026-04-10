/**
 * Canonical geometry space: all positions stored as 0..1 document-normalized.
 * Only these helpers convert between spaces (SVG / CSS / px).
 */

export const TRACK_VIEWBOX_HEIGHT = 1000;

export const playheadN = (scrollY: number, docHeight: number): number =>
  docHeight > 0 ? scrollY / docHeight : 0;

export const toChapterN = (startY: number, docHeight: number): number =>
  docHeight > 0 ? startY / docHeight : 0;

/**
 * Reference point used to determine the "active" chapter.
 * 40% down from viewport top, normalized to docHeight.
 */
export const activeReferenceN = (
  scrollY: number,
  vh: number,
  docHeight: number
): number => (docHeight > 0 ? (scrollY + vh * 0.4) / docHeight : 0);

export const toSVG = (n: number): number => n * TRACK_VIEWBOX_HEIGHT;

export const toPct = (n: number): string => `${(n * 100).toFixed(4)}%`;

export const clamp01 = (n: number): number =>
  n < 0 ? 0 : n > 1 ? 1 : n;
