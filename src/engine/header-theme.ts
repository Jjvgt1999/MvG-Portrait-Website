/**
 * Centralized header surface color maps.
 * The engine looks up top/bottom surfaces and writes these as CSS vars.
 * No theme objects, no if-blocks — just flat color maps per surface.
 */

export type HeaderSurface = 'paper' | 'ink' | 'dust';
export type HeaderTheme = 'dark-surface' | 'light-surface';

/** Occluder background per surface. */
export const SURFACE_COLORS: Record<HeaderSurface, string> = {
  paper: '#f5f1e8',
  ink: '#1a1a1a',
  dust: '#7a7a7a',
};

/** Icon / menu foreground per surface. */
export const SURFACE_FG: Record<HeaderSurface, string> = {
  paper: '#1a1a1a',
  ink: '#f5f1e8',
  dust: '#f5f1e8',
};

/** Chapter text color per surface. */
export const SURFACE_CHAPTER: Record<HeaderSurface, string> = {
  paper: '#1d6fe5',
  ink: '#7cb4ff',
  dust: '#7cb4ff',
};
