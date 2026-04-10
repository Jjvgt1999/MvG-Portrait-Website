import type { ChapterGeometry, TimelineFrameState } from '../../types';
import { toPct } from '../../normalize';

/**
 * HTML label lists. Positions are baked as inline CSS vars at geometry time.
 * Active label gets data-active="true" attribute on discrete state change.
 * The engine writes this imperatively — React does NOT re-render labels per frame.
 */
export class LabelLayer {
  private chapterItems: HTMLLIElement[] = [];
  private pageItems: HTMLLIElement[] = [];
  private lastActiveChapter = '';
  private lastActivePage = '';

  constructor(
    private chapterList: HTMLUListElement,
    private pageList: HTMLUListElement
  ) {}

  setChapters(chapters: ChapterGeometry[]): void {
    // Clear and rebuild chapter list
    this.chapterList.innerHTML = '';
    this.chapterItems = [];
    for (const c of chapters) {
      if (!c.label && c.id === 'intro') continue; // skip intro — no year label
      if (!c.label && c.id === 'opening-quote') continue;
      if (!c.label && c.id === 'events') continue;
      if (!c.label && c.id === 'credits') continue;
      const li = document.createElement('li');
      li.dataset.chapterId = c.id;
      li.style.setProperty('--label-y', toPct(c.labelYN));
      const year = document.createElement('span');
      year.className = 'label-year';
      year.textContent = c.label || c.title;
      li.appendChild(year);
      const title = document.createElement('span');
      title.className = 'label-title';
      title.textContent = c.title;
      li.appendChild(title);
      this.chapterList.appendChild(li);
      this.chapterItems.push(li);
    }

    // Page list
    this.pageList.innerHTML = '';
    this.pageItems = [];
    for (const c of chapters) {
      for (const p of c.pages) {
        if (!p.title) continue;
        const li = document.createElement('li');
        li.dataset.pageId = p.id;
        li.dataset.chapterId = c.id;
        li.style.setProperty('--label-y', toPct((p.startN + p.endN) / 2));
        li.textContent = p.title;
        this.pageList.appendChild(li);
        this.pageItems.push(li);
      }
    }
  }

  update(state: TimelineFrameState): void {
    if (state.activeChapterId !== this.lastActiveChapter) {
      for (const li of this.chapterItems) {
        const isActive = li.dataset.chapterId === state.activeChapterId;
        if (isActive) li.dataset.active = 'true';
        else delete li.dataset.active;
      }
      this.lastActiveChapter = state.activeChapterId;
    }
    if (state.activePageId !== this.lastActivePage) {
      for (const li of this.pageItems) {
        const isActive = li.dataset.pageId === state.activePageId;
        if (isActive) li.dataset.active = 'true';
        else delete li.dataset.active;
      }
      this.lastActivePage = state.activePageId;
    }
  }
}
