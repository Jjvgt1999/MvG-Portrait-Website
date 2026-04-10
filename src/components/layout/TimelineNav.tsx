import { useCallback, useRef, useMemo } from 'react';
import { scrollEngine } from '@/engine/scroll-engine';
import { useEngine } from '@/hooks/useEngine';
import type { TimelineRefs } from '@/engine/timeline/timeline-engine';
import { TRACK_VIEWBOX_HEIGHT } from '@/engine/normalize';

export type TimelineRefsHandle = {
  current: TimelineRefs;
};

/**
 * Hook that returns a stable ref container for all timeline layer elements.
 * Passed to App.tsx, which forwards it into engine.init().
 */
export function useTimelineRefs(): TimelineRefsHandle {
  const handle = useRef<TimelineRefs>({
    svg: null,
    trackLine: null,
    chapterTicksGroup: null,
    pageTicksGroup: null,
    activeSegment: null,
    fillLine: null,
    playheadDot: null,
    chapterLabelsList: null,
    pageLabelsList: null,
  });
  return handle;
}

type TimelineNavProps = {
  refs: TimelineRefsHandle;
};

export function TimelineNav({ refs }: TimelineNavProps) {
  const zoomMode = useEngine((s) => s.zoomMode);

  const setSvg = useCallback(
    (el: SVGSVGElement | null) => {
      refs.current.svg = el;
    },
    [refs]
  );
  const setTrack = useCallback(
    (el: SVGLineElement | null) => {
      refs.current.trackLine = el;
    },
    [refs]
  );
  const setChapterTicks = useCallback(
    (el: SVGGElement | null) => {
      refs.current.chapterTicksGroup = el;
    },
    [refs]
  );
  const setPageTicks = useCallback(
    (el: SVGGElement | null) => {
      refs.current.pageTicksGroup = el;
    },
    [refs]
  );
  const setActiveSegment = useCallback(
    (el: SVGLineElement | null) => {
      refs.current.activeSegment = el;
    },
    [refs]
  );
  const setFill = useCallback(
    (el: SVGLineElement | null) => {
      refs.current.fillLine = el;
    },
    [refs]
  );
  const setPlayhead = useCallback(
    (el: HTMLDivElement | null) => {
      refs.current.playheadDot = el;
    },
    [refs]
  );
  const setChapterLabels = useCallback(
    (el: HTMLUListElement | null) => {
      refs.current.chapterLabelsList = el;
    },
    [refs]
  );
  const setPageLabels = useCallback(
    (el: HTMLUListElement | null) => {
      refs.current.pageLabelsList = el;
    },
    [refs]
  );

  const handleLabelClick = useCallback((e: React.MouseEvent<HTMLUListElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLLIElement>('li');
    if (!target) return;
    const chapterId = target.dataset.chapterId;
    const pageId = target.dataset.pageId;
    if (zoomMode === 'zoomed') {
      if (pageId) scrollEngine.requestZoomExitToPage(pageId);
      else if (chapterId) scrollEngine.requestZoomExitToChapter(chapterId);
    } else {
      if (pageId) scrollEngine.scrollToPage(pageId);
      else if (chapterId) scrollEngine.scrollToChapter(chapterId);
    }
  }, [zoomMode]);

  const handleTrackClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Only treat as "zoom request" if the pointer hasn't been dragging
    if ((e as unknown as { detail: number }).detail === 0) return;
    // If we just finished scrubbing, the pointerup already cleared scrubbing.
    // A click directly on the track (no drag) enters zoom.
    const wasScrubbing = scrollEngine.isScrubbing();
    if (wasScrubbing) return;
    if (zoomMode === 'idle') {
      scrollEngine.requestZoomEnter();
    } else if (zoomMode === 'zoomed') {
      scrollEngine.requestZoomExit();
    }
  }, [zoomMode]);

  const viewBox = useMemo(() => `0 0 60 ${TRACK_VIEWBOX_HEIGHT}`, []);

  return (
    <nav className="timeline-nav" aria-label="Chapter timeline">
      <div className="timeline-nav-inner">
        <div className="timeline-svg-wrap">
          <svg
            ref={setSvg}
            className="timeline-svg"
            viewBox={viewBox}
            preserveAspectRatio="none"
            onClick={handleTrackClick}
          >
            <line ref={setTrack} className="timeline-track" />
            <line ref={setActiveSegment} className="timeline-active-segment" x1="30" x2="30" y1="0" y2="0" />
            <g ref={setChapterTicks} className="timeline-chapter-ticks-group" />
            <g ref={setPageTicks} className="timeline-page-ticks-group" />
            <line ref={setFill} className="timeline-fill" x1="30" x2="30" y1="0" y2="0" />
          </svg>
          <div
            ref={setPlayhead}
            className="timeline-playhead-dot"
            aria-hidden
          />
        </div>

        <ul
          ref={setChapterLabels}
          className="timeline-chapter-labels"
          onClick={handleLabelClick}
        />
        <ul
          ref={setPageLabels}
          className="timeline-page-labels"
          onClick={handleLabelClick}
        />
      </div>
    </nav>
  );
}
