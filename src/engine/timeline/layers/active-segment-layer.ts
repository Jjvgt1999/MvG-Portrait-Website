import type { TimelineFrameState } from '../../types';
import { toSVG } from '../../normalize';

/**
 * Highlighted span between active chapter's start and end.
 * Reads TWO spring values (segmentStart and segmentEnd), producing
 * the stretch-and-contract effect when active chapter changes.
 */
export class ActiveSegmentLayer {
  constructor(private line: SVGLineElement) {}

  update(state: TimelineFrameState): void {
    const y1 = toSVG(state.segmentStart);
    const y2 = toSVG(state.segmentEnd);
    this.line.setAttribute('y1', y1.toString());
    this.line.setAttribute('y2', y2.toString());
  }
}
