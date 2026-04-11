import type { ScrollEngine } from './scroll-engine';
import type { ChapterGeometry } from './types';

/**
 * Optional visual debug overlay. Toggled with Shift+D.
 * Renders:
 *   - hairlines at each chapter startN (blue)
 *   - hairlines at each page startN (grey, dotted)
 *   - readout panel in top-left with live state, including the canonical
 *     boundary packet produced by scroll-engine.ts::updateHeaderSurface()
 *   - four colored header-boundary guide lines (red/blue/green/yellow)
 *     that each read from a DIFFERENT source. If they ever separate
 *     during live scroll, the consumers are no longer reading bit-identical
 *     values and the synchronization defect is visible.
 *
 * Guide sources (one per color):
 *   red    — engine's raw globalPx (pre-snap ground truth, from boundary packet)
 *   blue   — occluder surface boundary, read via getComputedStyle of
 *            --header-occluder-bottom-inset-px
 *   green  — chapter text boundary, read via getComputedStyle of
 *            --header-fg-bottom-inset-px, offset by the cached safe-top
 *   yellow — menu icon boundary, same computed var as green but drawn as
 *            a separate line so icon-specific drift would be visible
 *
 * All four guides are full-width, 1px tall, and split into four horizontal
 * quadrants (25% each) so they form one continuous coloured stripe when
 * they agree — and show a visible step the moment any one disagrees.
 */

const GUIDE_COLORS = {
  page: '#ff3b30',       // red    — raw engine ground truth
  occluder: '#0a84ff',   // blue   — --header-occluder-bottom-inset-px
  chapter: '#30d158',    // green  — --header-fg-bottom-inset-px
  menu: '#ffd60a',       // yellow — --header-fg-bottom-inset-px (icon)
} as const;

type GuideKey = keyof typeof GUIDE_COLORS;

export class DebugLayer {
  private hairlinesEl: HTMLDivElement;
  private panelEl: HTMLDivElement;
  private boundaryGuidesEl: HTMLDivElement;
  private guideLines: Record<GuideKey, HTMLDivElement>;

  constructor(
    private engine: ScrollEngine,
    private contentEl: HTMLElement
  ) {
    // Hairlines container — absolutely positioned inside contentEl so lines scroll with content
    this.hairlinesEl = document.createElement('div');
    this.hairlinesEl.className = 'debug-hairlines';
    this.contentEl.appendChild(this.hairlinesEl);

    // Readout panel — fixed positioning
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'debug-panel';
    this.panelEl.innerHTML = `
      <dl>
        <dt>scrollY</dt><dd data-key="scrollY">0</dd>
        <dt>playhead</dt><dd data-key="playhead">0</dd>
        <dt>docHeight</dt><dd data-key="docHeight">0</dd>
        <dt>vh</dt><dd data-key="vh">0</dd>
        <dt>chapter</dt><dd data-key="chapter">—</dd>
        <dt>page</dt><dd data-key="page">—</dd>
        <dt>zoomMode</dt><dd data-key="zoomMode">idle</dd>
        <dt>timelineMode</dt><dd data-key="timelineMode">collapsed</dd>
        <dt>zoomScale</dt><dd data-key="zoomScale">1.00</dd>
        <dt>scrubbing</dt><dd data-key="scrubbing">false</dd>
        <dt>topSurface</dt><dd data-key="topSurface">—</dd>
        <dt>bottomSurface</dt><dd data-key="bottomSurface">—</dd>
        <dt>headerTotalH</dt><dd data-key="headerTotalH">0</dd>
        <dt>headerRowH</dt><dd data-key="headerRowH">0</dd>
        <dt>safeTop</dt><dd data-key="safeTop">0</dd>
        <dt>rawGlobalPx</dt><dd data-key="rawGlobalPx">0</dd>
        <dt>rawLocalPx</dt><dd data-key="rawLocalPx">0</dd>
        <dt>occluderBottom</dt><dd data-key="occluderBottom">0</dd>
        <dt>fgBottom</dt><dd data-key="fgBottom">0</dd>
      </dl>
    `;
    document.body.appendChild(this.panelEl);

    // Boundary guides container — four fixed 1px lines split into quadrants.
    // Appended to <body> so they stay in viewport space like the occluder.
    this.boundaryGuidesEl = document.createElement('div');
    this.boundaryGuidesEl.className = 'debug-boundary-guides';

    const makeGuide = (key: GuideKey, leftPct: number): HTMLDivElement => {
      const el = document.createElement('div');
      el.className = 'debug-boundary-guide';
      el.dataset.source = key;
      el.style.left = `${leftPct}%`;
      el.style.width = '25%';
      el.style.background = GUIDE_COLORS[key];
      return el;
    };
    this.guideLines = {
      page:     makeGuide('page', 0),
      occluder: makeGuide('occluder', 25),
      chapter:  makeGuide('chapter', 50),
      menu:     makeGuide('menu', 75),
    };
    this.boundaryGuidesEl.appendChild(this.guideLines.page);
    this.boundaryGuidesEl.appendChild(this.guideLines.occluder);
    this.boundaryGuidesEl.appendChild(this.guideLines.chapter);
    this.boundaryGuidesEl.appendChild(this.guideLines.menu);
    document.body.appendChild(this.boundaryGuidesEl);
  }

  destroy(): void {
    this.hairlinesEl.remove();
    this.panelEl.remove();
    this.boundaryGuidesEl.remove();
  }

  refresh(): void {
    this.update();
  }

  onGeometryUpdated(chapters: ChapterGeometry[]): void {
    this.hairlinesEl.innerHTML = '';
    const docH = this.engine.state.docHeight;
    if (docH <= 0) return;

    for (const c of chapters) {
      const line = document.createElement('div');
      line.className = 'debug-chapter-line';
      line.style.top = `${c.startY}px`;
      line.dataset.label = `${c.label || c.id} — ${c.title}`.trim();
      this.hairlinesEl.appendChild(line);

      for (const p of c.pages) {
        if (p.index === 0) continue; // skip first page (overlaps chapter start)
        const pl = document.createElement('div');
        pl.className = 'debug-page-line';
        pl.style.top = `${p.startY}px`;
        this.hairlinesEl.appendChild(pl);
      }
    }
  }

  update(): void {
    if (!this.engine.state.debug) return;
    const set = (key: string, value: string): void => {
      const el = this.panelEl.querySelector<HTMLElement>(`[data-key="${key}"]`);
      if (el) el.textContent = value;
    };
    const s = this.engine.state;
    set('scrollY', Math.round(s.rawScrollY).toString());
    set('playhead', s.playheadRaw.toFixed(4));
    set('docHeight', Math.round(s.docHeight).toString());
    set('vh', Math.round(s.viewportH).toString());
    set('chapter', s.activeChapterId || '—');
    set('page', s.activePageId || '—');
    set('zoomMode', s.zoomMode);
    set('timelineMode', s.timelineMode);
    set('zoomScale', s.zoomScale.toFixed(3));
    set('scrubbing', s.scrubbing ? 'true' : 'false');

    // Canonical boundary packet readout + guide positioning.
    const b = this.engine.getHeaderBoundaryState();
    set('topSurface', b.topSurface);
    set('bottomSurface', b.bottomSurface);
    set('headerTotalH', b.headerTotalHeightPx.toFixed(1));
    set('headerRowH', b.headerRowHeightPx.toFixed(1));
    set('safeTop', b.safeTopPx.toFixed(1));
    set('rawGlobalPx', b.rawGlobalPx.toFixed(3));
    set('rawLocalPx', b.rawLocalPx.toFixed(3));
    set('occluderBottom', b.occluderBottomInsetPx.toFixed(1));
    set('fgBottom', b.fgBottomInsetPx.toFixed(1));

    this.renderBoundaryGuides(b.topSurface === b.bottomSurface, b.rawGlobalPx, b.safeTopPx);
  }

  /**
   * Position the four boundary guide lines per-frame.
   *
   * Each line reads from a DIFFERENT source so any drift between the
   * canonical packet, the CSS var round-trip, and the safe-area offset
   * shows up as a visible step in the stripe:
   *
   *   red    — engine raw globalPx (from boundary packet snapshot)
   *   blue   — CSS var --header-occluder-bottom-inset-px via getComputedStyle
   *   green  — CSS var --header-fg-bottom-inset-px + cachedSafeTop
   *   yellow — same as green (drawn separately to catch icon-specific drift)
   *
   * When topSurface === bottomSurface the guides are hidden — there is no
   * boundary to check against.
   */
  private renderBoundaryGuides(
    noActiveBoundary: boolean,
    rawGlobalPx: number,
    safeTopPx: number
  ): void {
    if (noActiveBoundary) {
      this.boundaryGuidesEl.dataset.active = 'false';
      return;
    }
    this.boundaryGuidesEl.dataset.active = 'true';

    const css = getComputedStyle(document.documentElement);
    const parsePx = (name: string): number => {
      const v = css.getPropertyValue(name).trim();
      return v ? parseFloat(v) : 0;
    };
    const occluderBottomY = parsePx('--header-occluder-bottom-inset-px');
    const fgBottomY = parsePx('--header-fg-bottom-inset-px') + safeTopPx;

    // RED — raw engine ground truth (pre-snap).
    this.guideLines.page.style.top = `${rawGlobalPx}px`;
    // BLUE — occluder bottom inset read back via CSS var.
    this.guideLines.occluder.style.top = `${occluderBottomY}px`;
    // GREEN — chapter text bottom inset (local + safe area).
    this.guideLines.chapter.style.top = `${fgBottomY}px`;
    // YELLOW — same math as green; drawn separately to expose icon drift.
    this.guideLines.menu.style.top = `${fgBottomY}px`;
  }
}
