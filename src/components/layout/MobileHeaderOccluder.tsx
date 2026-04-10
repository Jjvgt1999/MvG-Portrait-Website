/**
 * Layer 2: Single-element occluder with hard gradient split.
 * Background is a linear-gradient that transitions instantly at the boundary.
 * Colors + boundary driven by CSS custom properties written by the engine.
 *
 * Using a single gradient instead of two clipped child elements eliminates
 * sub-pixel seams from independent clip-path rasterization on the GPU.
 */
export function MobileHeaderOccluder() {
  return <div id="header-occluder" aria-hidden="true" />;
}
