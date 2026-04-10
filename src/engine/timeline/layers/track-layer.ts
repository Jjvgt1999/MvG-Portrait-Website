import { TRACK_VIEWBOX_HEIGHT } from '../../normalize';

/**
 * Static background track line. Set once at attach time, never mutated.
 */
export class TrackLayer {
  constructor(line: SVGLineElement) {
    line.setAttribute('x1', '30');
    line.setAttribute('x2', '30');
    line.setAttribute('y1', '0');
    line.setAttribute('y2', String(TRACK_VIEWBOX_HEIGHT));
  }
}
