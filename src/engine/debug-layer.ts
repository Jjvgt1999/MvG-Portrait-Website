import type { ScrollEngine } from './scroll-engine';
import type { ChapterGeometry } from './types';

/**
 * Optional visual debug overlay. Toggled with Shift+D.
 * Renders:
 *   - hairlines at each chapter startN (blue)
 *   - hairlines at each page startN (grey, dotted)
 *   - three fixed cutline indicators in viewport space:
 *       red   = header zone bottom (cachedHeaderTotalH)
 *       cyan  = surface cutline (the real visible content edge)
 *       green = computed split boundary
 *   - readout panel in top-left with live state + cutline diagnostics
 */
export class DebugLayer {
  private hairlinesEl: HTMLDivElement;
  private panelEl: HTMLDivElement;

  // Fixed-position cutline debug lines
  private lineZoneBottom: HTMLDivElement;
  private lineCutline: HTMLDivElement;
  private lineSplitBoundary: HTMLDivElement;

  constructor(
    private engine: ScrollEngine,
    private contentEl: HTMLElement
  ) {
    // Hairlines container — absolutely positioned inside contentEl so lines scroll with content
    this.hairlinesEl = document.createElement('div');
    this.hairlinesEl.className = 'debug-hairlines';
    this.contentEl.appendChild(this.hairlinesEl);

    // Fixed cutline debug lines (viewport-space)
    this.lineZoneBottom = this.createFixedLine('debug-line-zone-bottom');
    this.lineCutline = this.createFixedLine('debug-line-cutline');
    this.lineSplitBoundary = this.createFixedLine('debug-line-split-boundary');

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
        <dt class="debug-sep">── cutline ──</dt><dd></dd>
        <dt>headerTotalH</dt><dd data-key="headerTotalH">0</dd>
        <dt>cutlineOffset</dt><dd data-key="cutlineOffset">0</dd>
        <dt>surfaceCutline</dt><dd data-key="surfaceCutline">0</dd>
        <dt>globalBoundary</dt><dd data-key="globalBoundary">0</dd>
        <dt>topSurface</dt><dd data-key="topSurface">—</dd>
        <dt>bottomSurface</dt><dd data-key="bottomSurface">—</dd>
      </dl>
    `;
    document.body.appendChild(this.panelEl);
  }

  private createFixedLine(className: string): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `debug-fixed-line ${className}`;
    document.body.appendChild(el);
    return el;
  }

  destroy(): void {
    this.hairlinesEl.remove();
    this.panelEl.remove();
    this.lineZoneBottom.remove();
    this.lineCutline.remove();
    this.lineSplitBoundary.remove();
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

    // Cutline diagnostics — use engine getters + live CSS vars
    const rootStyle = getComputedStyle(document.documentElement);
    const headerTotalH = this.engine.headerTotalHeightPx;
    const surfaceCutline = this.engine.surfaceCutlinePx;
    const globalBoundary = parseFloat(rootStyle.getPropertyValue('--header-boundary-px-global')) || 0;
    const cutlineOffset = surfaceCutline - headerTotalH;

    set('headerTotalH', headerTotalH.toFixed(1));
    set('cutlineOffset', (cutlineOffset >= 0 ? '+' : '') + cutlineOffset.toFixed(1));
    set('surfaceCutline', surfaceCutline.toFixed(1));
    set('globalBoundary', globalBoundary.toFixed(1));
    set('topSurface', s.headerTopSurface || '—');
    set('bottomSurface', s.headerSurface || '—');

    // Position the three fixed debug lines in viewport space
    // Red: header zone bottom = cachedHeaderTotalH from viewport top
    this.lineZoneBottom.style.top = `${headerTotalH}px`;

    // Cyan: actual surface cutline
    this.lineCutline.style.top = `${surfaceCutline}px`;

    // Green: computed split boundary (globalBoundary from viewport top)
    this.lineSplitBoundary.style.top = `${globalBoundary}px`;
  }
}
