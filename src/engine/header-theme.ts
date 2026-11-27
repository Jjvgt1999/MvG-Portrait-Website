/**
 * Centralized header stencil color map + geometry contract.
 *
 * - SURFACE_FG: the engine looks up the top/bottom surfaces at the header
 *   zone edges and writes these as CSS vars each frame. Chapter text and
 *   menu icon stencils both draw from this single pair.
 * - HEADER_GEOMETRY: single source of truth for header layout metrics. Engine
 *   math, React SVG markup, production CSS, and debug CSS all consume this —
 *   either directly (TS import) or indirectly (via CSS vars the engine writes
 *   from this object at init time). No magic numbers anywhere.
 */

export type HeaderSurface = 'paper' | 'ink' | 'dust';
export type HeaderTheme = 'dark-surface' | 'light-surface';

/**
 * Stencil foreground paint per surface. Both chapter text and menu icon
 * stencils draw from this pair — one shared color pair, one shared boundary.
 */
export const SURFACE_FG: Record<HeaderSurface, string> = {
  paper: '#1a1a1a',
  ink: '#f5f1e8',
  dust: '#f5f1e8',
};

/**
 * Surface background colors — underlay pseudo-element paints these to occlude
 * content behind the fixed header. Same surface pair as SURFACE_FG, same
 * boundary position — one source of truth.
 */
export const SURFACE_COLORS: Record<HeaderSurface, string> = {
  paper: '#f5f1e8',
  ink: '#1a1a1a',
  dust: '#7a7a7a',
};

/**
 * Header layout geometry. Single source of truth.
 *
 * Engine math imports these directly. At init the engine propagates each
 * value into a matching CSS custom property so production CSS and debug CSS
 * consume the same numbers.
 *
 * Must stay in sync with `--header-height` / `--header-horizontal-padding`
 * in index.css :root. The engine asserts this on init with a tolerance.
 */
export const HEADER_GEOMETRY = {
  headerRowHeightPx: 48,             // → --header-height
  headerHorizontalPaddingPx: 14,     // → --header-horizontal-padding
  menuButtonSizePx: 44,              // → --menu-button-size-px
  menuIconTopPx: 16,                 // → --menu-icon-top-px
  menuIconHeightPx: 16,              // → --menu-icon-height-px
  menuIconViewBoxW: 20,              // → --menu-icon-viewbox-w-px
  menuIconViewBoxH: 16,              // → --menu-icon-viewbox-h-px
} as const;

/** Tolerance (px) for the header-row-height contract drift check. */
export const HEADER_GEOMETRY_TOLERANCE_PX = 1;
