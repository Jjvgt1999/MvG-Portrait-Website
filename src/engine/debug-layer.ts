import type { ScrollEngine } from './scroll-engine';
import type { ChapterGeometry } from './types';

/**
 * Optional visual debug overlay. Toggled with Shift+D.
 * Renders:
 *   - hairlines at each chapter startN (blue)
 *   - hairlines at each page startN (grey, dotted)
 *   - readout panel in top-left with live state
 */
export class DebugLayer {
  private hairlinesEl: HTMLDivElement;
  private panelEl: HTMLDivElement;

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
      </dl>
    `;
    document.body.appendChild(this.panelEl);
  }

  destroy(): void {
    this.hairlinesEl.remove();
    this.panelEl.remove();
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
  }
}
