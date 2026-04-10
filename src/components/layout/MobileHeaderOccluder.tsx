/**
 * Layer 2: Dual-surface occluder.
 * Two child divs fill the full header zone, each clipped at the boundary.
 * The top child shows the surface above the boundary; the bottom child
 * shows the surface below. When no boundary exists, both are the same
 * color and the split is invisible.
 *
 * Colors + clip driven by CSS custom properties written by the engine.
 */
export function MobileHeaderOccluder() {
  return (
    <div id="header-occluder" aria-hidden="true">
      <div className="occluder-surface occluder-top" />
      <div className="occluder-surface occluder-bottom" />
    </div>
  );
}
