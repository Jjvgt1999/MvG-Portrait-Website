import type { ScrollEngine } from './scroll-engine';
import type { ChapterGeometry } from './types';

/**
 * Optional visual debug overlay. Toggled with Shift+D.
 * Renders:
 *   - hairlines at each chapter startN (blue)
 *   - hairlines at each page startN (grey, dotted)
 *   - readout panel in top-left with live state
 *   - header debug: red line at zone bottom, green line at boundary,
 *     and header-specific readout values
 */
export class DebugLayer {
  private hairlinesEl: HTMLDivElement;
  private panelEl: HTMLDivElement;
  private headerBottomLine: HTMLDivElement;
  private headerBoundaryLine: HTMLDivElement;

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
        <dt>topSurface</dt><dd data-key="hdr-top">paper</dd>
        <dt>bottomSurface</dt><dd data-key="hdr-bottom">paper</dd>
        <dt>boundaryPx</dt><dd data-key="hdr-boundary">48</dd>
        <dt>headerH</dt><dd data-key="hdr-height">48</dd>
        <dt>boundaryN</dt><dd data-key="hdr-boundaryN">1.00</dd>
      </dl>
    `;
    document.body.appendChild(this.panelEl);

    // Header debug lines — fixed, full-width
    this.headerBottomLine = document.createElement('div');
    this.headerBottomLine.className = 'debug-header-bottom-line';
    document.body.appendChild(this.headerBottomLine);

    this.headerBoundaryLine = document.createElement('div');
    this.headerBoundaryLine.className = 'debug-header-boundary-line';
    document.body.appendChild(this.headerBoundaryLine);
  }

  destroy(): void {
    this.hairlinesEl.remove();
    this.panelEl.remove();
    this.headerBottomLine.remove();
    this.headerBoundaryLine.remove();
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

    // Header debug values
    const hd = this.engine.headerDebugState;
    set('hdr-top', hd.topSurface);
    set('hdr-bottom', hd.bottomSurface);
    set('hdr-boundary', hd.globalBoundaryPx.toFixed(1));
    set('hdr-height', hd.headerTotalH.toFixed(0));
    set('hdr-boundaryN', hd.boundaryN.toFixed(3));

    // Position header debug lines
    this.headerBottomLine.style.top = `${hd.headerTotalH}px`;
    this.headerBoundaryLine.style.top = `${hd.globalBoundaryPx}px`;
  }
}
