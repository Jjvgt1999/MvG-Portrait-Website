/**
 * Layer 2: Single-element occluder with hard-stop CSS gradient.
 *
 * A single div fills the full header zone. The background is a
 * hard-stop linear-gradient that splits at --header-boundary-px-global,
 * using --header-top-surface-bg above and --header-bottom-surface-bg below.
 *
 * When no boundary exists, both colors are the same and the split
 * is invisible.
 *
 * Colors + boundary driven by CSS custom properties written by the engine.
 */
export function MobileHeaderOccluder() {
  return <div id="header-occluder" aria-hidden="true" />;
}
