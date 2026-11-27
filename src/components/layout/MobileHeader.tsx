import { useCallback, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';

/**
 * Stencil foreground chrome — single-instance header elements.
 *
 * Chapter text: shared `background-clip: text` gradient on `.header-chapter-wrap`.
 * Menu icon: CSS `mask-image` stencil on `.header-menu-icon` span.
 * Both consume the same row-local boundary (`--header-boundary-row-px`) and the
 * same `SURFACE_FG` color pair (`--header-fg-top` / `--header-fg-bottom`).
 *
 * The underlay (`#site-header::before`) uses the zone-local boundary and
 * `SURFACE_COLORS` — all driven from the same engine source of truth.
 */

/** Menu icon — CSS-masked span, no SVG needed. */
function MenuIcon() {
  return <span className="header-menu-icon" aria-hidden="true" />;
}

export function MobileHeader() {
  const activeId = useEngine((s) => s.activeChapterId);
  const pastHero = useEngine((s) => s.pastHero);

  // --- TOC drawer state ---
  const [tocOpen, setTocOpen] = useState(false);

  const openToc = useCallback(() => {
    setTocOpen(true);
    document.documentElement.style.overflow = 'hidden';
  }, []);

  const closeToc = useCallback(() => {
    setTocOpen(false);
    document.documentElement.style.overflow = '';
  }, []);

  const handleChapterClick = useCallback(
    (id: string) => {
      closeToc();
      requestAnimationFrame(() => {
        scrollEngine.scrollToChapter(id);
      });
    },
    [closeToc]
  );

  // Chapter text content — updates instantly on activeId change. The CSS
  // opacity transition on `data-visible` still handles the pastHero
  // entry/exit; chapter-to-chapter swaps are immediate so the text never
  // sits in a fade-out dead window during rapid scroll.
  const chapter = chapters.find((c) => c.id === activeId);
  const showChapterText = pastHero;
  const chapterLabel = chapter?.label || '';
  const chapterTitle = chapter?.title || '';

  return (
    <>
      {/* Layer B: transparent stencil chrome — single-instance foreground */}
      <header id="site-header">
        <div className="header-row">
          {/* Chapter text — single instance, painted by shared stencil gradient */}
          <div
            className="header-chapter-wrap"
            data-visible={showChapterText ? 'true' : 'false'}
          >
            {chapterLabel && (
              <span className="header-chapter-label">{chapterLabel}</span>
            )}
            <span className="header-chapter-title">{chapterTitle}</span>
          </div>

          {/* Menu icon — CSS mask stencil, shared foreground gradient */}
          <button
            className="header-menu"
            onClick={openToc}
            aria-label="Inhaltsverzeichnis"
            aria-expanded={tocOpen}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* TOC drawer overlay */}
      <div
        className="mobile-toc-overlay"
        data-open={tocOpen ? 'true' : 'false'}
        onClick={closeToc}
      >
        <nav
          className="mobile-toc-drawer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Inhaltsverzeichnis"
        >
          <div className="mobile-toc-header">
            <span className="mobile-toc-title">Inhalt</span>
            <button
              className="mobile-toc-close"
              onClick={closeToc}
              aria-label="Schließen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          <ul className="mobile-toc-list">
            {chapters.map((c) => (
              <li
                key={c.id}
                data-active={c.id === activeId ? 'true' : 'false'}
              >
                <button onClick={() => handleChapterClick(c.id)}>
                  {c.label && <span className="toc-label">{c.label}</span>}
                  <span className="toc-title">{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
