import type { ChapterGeometry, PageGeometry } from './types';
import { toChapterN } from './normalize';

/**
 * Wait two animation frames to ensure layout is fully flushed
 * (rAF fires after style recalc but before layout; double rAF guarantees it).
 *
 * Falls back to a microtask if document is hidden (background tabs throttle rAF).
 */
export async function waitForLayout(): Promise<void> {
  if (typeof document !== 'undefined' && document.hidden) {
    // Background tab: don't wait for rAF — use a microtask + 0ms timer
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    return;
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Measure chapter + page geometry against a canonical content wrapper.
 * Must only be called when zoomMode === 'idle' (the wrapper's bounding rects
 * are only correct when the wrapper is in normal flow).
 */
export async function measureGeometry(
  contentEl: HTMLElement
): Promise<ChapterGeometry[]> {
  await waitForLayout();

  const docHeight = contentEl.offsetHeight;
  const scrollTop = window.scrollY;

  // Chapter markers: have data-chapter-id but NOT data-page-id
  const chapterEls = Array.from(
    contentEl.querySelectorAll<HTMLElement>(
      '[data-chapter-id]:not([data-page-id])'
    )
  );

  const chapters: ChapterGeometry[] = [];

  for (let i = 0; i < chapterEls.length; i++) {
    const el = chapterEls[i];
    const rect = el.getBoundingClientRect();
    const startY = rect.top + scrollTop;
    const nextEl = chapterEls[i + 1];
    const endY = nextEl
      ? nextEl.getBoundingClientRect().top + scrollTop
      : docHeight;

    const chapterId = el.dataset.chapterId ?? `chapter-${i}`;
    const label = el.dataset.label ?? '';
    const title = el.dataset.title ?? '';

    // Collect page markers belonging to this chapter
    const pages: PageGeometry[] = [];
    const allPageEls = contentEl.querySelectorAll<HTMLElement>(
      `[data-page-id][data-chapter-id="${chapterId}"]`
    );
    const pageList = Array.from(allPageEls);
    for (let p = 0; p < pageList.length; p++) {
      const pe = pageList[p];
      const pr = pe.getBoundingClientRect();
      const pStart = pr.top + scrollTop;
      const pEnd =
        p + 1 < pageList.length
          ? pageList[p + 1].getBoundingClientRect().top + scrollTop
          : endY;
      pages.push({
        id: pe.dataset.pageId ?? `page-${chapterId}-${p}`,
        chapterId,
        index: p,
        title: pe.dataset.title ?? '',
        startY: pStart,
        endY: pEnd,
        startN: toChapterN(pStart, docHeight),
        endN: toChapterN(pEnd, docHeight),
        lengthN: toChapterN(pEnd - pStart, docHeight),
      });
    }

    const startN = toChapterN(startY, docHeight);
    const endN = toChapterN(endY, docHeight);

    chapters.push({
      id: chapterId,
      label,
      title,
      startY,
      endY,
      startN,
      endN,
      lengthN: endN - startN,
      pages,
      labelYN: (startN + endN) / 2,
    });
  }

  return chapters;
}

export function computeDocHeight(contentEl: HTMLElement): number {
  return contentEl.offsetHeight;
}
