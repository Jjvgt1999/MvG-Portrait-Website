import type { ScrollEngine } from '../scroll-engine';
import type {
  ChapterGeometry,
  TimelineFrameState,
} from '../types';
import { TrackLayer } from './layers/track-layer';
import { ChapterTickLayer } from './layers/chapter-tick-layer';
import { PageTickLayer } from './layers/page-tick-layer';
import { ActiveSegmentLayer } from './layers/active-segment-layer';
import { PlayheadLayer } from './layers/playhead-layer';
import { LabelLayer } from './layers/label-layer';

export type TimelineRefs = {
  svg: SVGSVGElement | null;
  trackLine: SVGLineElement | null;
  chapterTicksGroup: SVGGElement | null;
  pageTicksGroup: SVGGElement | null;
  activeSegment: SVGLineElement | null;
  fillLine: SVGLineElement | null;
  /** HTML element for the playhead dot — NOT a circle inside the SVG, because
   *  the SVG uses preserveAspectRatio="none" which would squish a circle. */
  playheadDot: HTMLDivElement | null;
  chapterLabelsList: HTMLUListElement | null;
  pageLabelsList: HTMLUListElement | null;
};

export class TimelineEngine {
  private chapterTickLayer: ChapterTickLayer | null = null;
  private pageTickLayer: PageTickLayer | null = null;
  private activeSegmentLayer: ActiveSegmentLayer | null = null;
  private playheadLayer: PlayheadLayer | null = null;
  private labelLayer: LabelLayer | null = null;

  private svg: SVGSVGElement | null = null;

  // Pointer scrub state
  private pointerActive = false;
  private pointerId: number | null = null;

  constructor(private engine: ScrollEngine, refs: TimelineRefs) {
    this.attach(refs);
  }

  private attach(refs: TimelineRefs): void {
    this.svg = refs.svg;
    if (refs.trackLine) new TrackLayer(refs.trackLine);
    if (refs.chapterTicksGroup) {
      this.chapterTickLayer = new ChapterTickLayer(refs.chapterTicksGroup);
    }
    if (refs.pageTicksGroup) {
      this.pageTickLayer = new PageTickLayer(refs.pageTicksGroup);
    }
    if (refs.activeSegment) {
      this.activeSegmentLayer = new ActiveSegmentLayer(refs.activeSegment);
    }
    if (refs.fillLine && refs.playheadDot) {
      this.playheadLayer = new PlayheadLayer(refs.fillLine, refs.playheadDot);
    }
    if (refs.chapterLabelsList && refs.pageLabelsList) {
      this.labelLayer = new LabelLayer(
        refs.chapterLabelsList,
        refs.pageLabelsList
      );
    }

    this.attachPointerHandlers();
  }

  destroy(): void {
    this.detachPointerHandlers();
    this.svg = null;
  }

  onGeometryUpdated(chapters: ChapterGeometry[]): void {
    this.chapterTickLayer?.setChapters(chapters);
    this.pageTickLayer?.setChapters(chapters);
    this.labelLayer?.setChapters(chapters);
  }

  update(state: TimelineFrameState): void {
    this.activeSegmentLayer?.update(state);
    this.playheadLayer?.update(state);
    this.labelLayer?.update(state);
  }

  // ============================================================
  // Pointer scrub
  // ============================================================
  private onPointerDown = (e: PointerEvent): void => {
    if (!this.svg) return;
    if (this.engine.state.prefersReducedMotion) return;
    if (this.engine.state.zoomMode === 'entering' || this.engine.state.zoomMode === 'exiting') {
      return;
    }
    // Ignore touch on narrow viewports
    if (e.pointerType === 'touch' && window.innerWidth < 768) return;

    if (!this.engine.startScrubbing()) return;
    this.pointerActive = true;
    this.pointerId = e.pointerId;
    try {
      this.svg.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const rect = this.svg.getBoundingClientRect();
    const frac = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / rect.height)
    );
    this.engine.setScrubTarget(frac * this.engine.state.docHeight);
    e.preventDefault();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.pointerActive || !this.svg) return;
    if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
    const rect = this.svg.getBoundingClientRect();
    const frac = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / rect.height)
    );
    this.engine.setScrubTarget(frac * this.engine.state.docHeight);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.pointerActive) return;
    if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
    this.releasePointer();
  };

  private releasePointer(): void {
    if (!this.pointerActive || !this.svg) return;
    if (this.pointerId !== null) {
      try {
        this.svg.releasePointerCapture(this.pointerId);
      } catch {
        /* ignore */
      }
    }
    this.pointerActive = false;
    this.pointerId = null;
    this.engine.endScrubbing();
  }

  private attachPointerHandlers(): void {
    if (!this.svg) return;
    this.svg.addEventListener('pointerdown', this.onPointerDown);
    this.svg.addEventListener('pointermove', this.onPointerMove);
    this.svg.addEventListener('pointerup', this.onPointerUp);
    this.svg.addEventListener('pointercancel', this.onPointerUp);
  }

  private detachPointerHandlers(): void {
    if (!this.svg) return;
    this.svg.removeEventListener('pointerdown', this.onPointerDown);
    this.svg.removeEventListener('pointermove', this.onPointerMove);
    this.svg.removeEventListener('pointerup', this.onPointerUp);
    this.svg.removeEventListener('pointercancel', this.onPointerUp);
  }
}
