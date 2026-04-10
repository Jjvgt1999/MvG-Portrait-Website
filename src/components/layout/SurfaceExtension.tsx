/**
 * Pure surface continuation layer.
 *
 * Extends the page's global surface into the header zone so scrolling
 * content is occluded. Uses the exact same colors and boundary as the
 * page surface system via engine-written CSS custom properties.
 *
 * This is NOT a header background. It is part of the page surface,
 * rendered at a higher z-index to occlude scrolling content.
 *
 * Rules:
 * - No blur, opacity, borders, shadows, filters, or independent animation
 * - Colors from SURFACE_COLORS via --header-top-surface-bg / --header-bottom-surface-bg
 * - Boundary from --header-boundary-px-global (same source as page surface system)
 */
export function SurfaceExtension() {
  return <div id="surface-extension" aria-hidden="true" />;
}
