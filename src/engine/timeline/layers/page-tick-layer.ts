import type { ChapterGeometry } from '../../types';
import { toSVG } from '../../normalize';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Short ticks at each page's startN. Opacity driven by --label-opacity CSS var.
 * Only page starts that are NOT identical to their chapter's start get a tick
 * (so the chapter tick isn't overdrawn by an identical page tick).
 */
export class PageTickLayer {
  constructor(private group: SVGGElement) {}

  setChapters(chapters: ChapterGeometry[]): void {
    while (this.group.firstChild) {
      this.group.removeChild(this.group.firstChild);
    }
    for (const c of chapters) {
      for (let i = 1; i < c.pages.length; i++) {
        const p = c.pages[i];
        const y = toSVG(p.startN);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('class', 'timeline-page-tick');
        line.setAttribute('x1', '26');
        line.setAttribute('x2', '34');
        line.setAttribute('y1', y.toString());
        line.setAttribute('y2', y.toString());
        line.dataset.pageId = p.id;
        line.dataset.chapterId = c.id;
        this.group.appendChild(line);
      }
    }
  }
}
