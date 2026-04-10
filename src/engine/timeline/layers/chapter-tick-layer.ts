import type { ChapterGeometry } from '../../types';
import { toSVG } from '../../normalize';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draws a short horizontal tick at each chapter's startN.
 * Positions are refreshed whenever geometry is re-measured.
 */
export class ChapterTickLayer {
  private ticks: SVGLineElement[] = [];

  constructor(private group: SVGGElement) {}

  setChapters(chapters: ChapterGeometry[]): void {
    // Clear existing
    while (this.group.firstChild) {
      this.group.removeChild(this.group.firstChild);
    }
    this.ticks = [];

    for (const c of chapters) {
      const y = toSVG(c.startN);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'timeline-chapter-tick');
      line.setAttribute('x1', '22');
      line.setAttribute('x2', '38');
      line.setAttribute('y1', y.toString());
      line.setAttribute('y2', y.toString());
      line.dataset.chapterId = c.id;
      this.group.appendChild(line);
      this.ticks.push(line);
    }
  }
}
