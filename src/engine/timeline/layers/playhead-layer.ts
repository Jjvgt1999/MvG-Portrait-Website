import type { TimelineFrameState } from '../../types';
import { toSVG } from '../../normalize';

/**
 * Fill line drawn inside the SVG (immune to preserveAspectRatio="none" because
 * it's a pure vertical stroke), plus a dot positioned as an HTML element outside
 * the SVG so it stays perfectly round regardless of the SVG's x/y scale ratio.
 */
export class PlayheadLayer {
  constructor(
    private fillLine: SVGLineElement,
    private dot: HTMLDivElement
  ) {
    this.fillLine.setAttribute('x1', '30');
    this.fillLine.setAttribute('x2', '30');
    this.fillLine.setAttribute('y1', '0');
  }

  update(state: TimelineFrameState): void {
    const smoothedY = toSVG(state.playheadSmoothed);
    this.fillLine.setAttribute('y2', smoothedY.toString());
    // The HTML dot is positioned via CSS variable --playhead-top
    // (percentage of the nav-inner height), so it tracks the raw playhead
    // exactly without any SVG aspect distortion.
    this.dot.style.setProperty(
      '--playhead-top',
      `${(state.playheadRaw * 100).toFixed(4)}%`
    );
  }
}
