import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';
import { HEADER_GEOMETRY } from '@/engine/header-theme';

/**
 * Layer B: Stencil foreground chrome (transparent plate, single-instance
 * foreground elements).
 *
 * Chapter label + title are ONE HTML block painted by a shared
 * `background-clip: text` gradient on `.header-chapter-wrap`. The menu icon
 * is ONE SVG with a shared `<linearGradient>` whose middle stop offsets are
 * written directly by the engine each frame (see scroll-engine.ts
 * updateHeaderSurface). Both stencils share one coordinate system via
 * `--header-boundary-local-px`, so their splits land on the same device row.
 *
 * There are NO duplicated text or icon layers. The stencil architecture
 * replaces the previous clip-path split.
 */

/**
 * Menu icon — single instance, shared linearGradient paint.
 *
 * Stop ids `header-menu-stop-top-end` and `header-menu-stop-bot-start` are
 * stable globals looked up by the engine. Because `MobileHeader` is mounted
 * exactly once (see singleton invariant in the component), these ids are safe
 * as literals. If that invariant ever changes, switch to useId()-derived ids.
 */
function MenuSVG() {
  const w = HEADER_GEOMETRY.menuIconViewBoxW;
  const h = HEADER_GEOMETRY.menuIconViewBoxH;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="header-menu-stencil"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={h}
        >
          <stop offset="0" stopColor="var(--header-top-fg)" />
          <stop
            id="header-menu-stop-top-end"
            offset="1"
            stopColor="var(--header-top-fg)"
          />
          <stop
            id="header-menu-stop-bot-start"
            offset="1"
            stopColor="var(--header-bottom-fg)"
          />
          <stop offset="1" stopColor="var(--header-bottom-fg)" />
        </linearGradient>
      </defs>
      <line x1="0" y1="1" x2={w} y2="1" stroke="url(#header-menu-stencil)" strokeWidth="1.5" />
      <line x1="0" y1="8" x2={w} y2="8" stroke="url(#header-menu-stencil)" strokeWidth="1.5" />
      <line x1="0" y1="15" x2={w} y2="15" stroke="url(#header-menu-stencil)" strokeWidth="1.5" />
    </svg>
  );
}

/** Mounted exactly once in App.tsx. The menu gradient id is a global singleton. */
export function MobileHeader() {
  const activeId = useEngine((s) => s.activeChapterId);
  const pastHero = useEngine((s) => s.pastHero);

  // --- Chapter cross-fade (360ms) ---
  const [displayedId, setDisplayedId] = useState(activeId);
  const [phase, setPhase] = useState<'visible' | 'fading-out'>('visible');
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (activeId === displayedId) return;
    setPhase('fading-out');
    if (fadeTimer.current !== null) clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setDisplayedId(activeId);
      setPhase('visible');
      fadeTimer.current = null;
    }, 360);
    return () => {
      if (fadeTimer.current !== null) {
        clearTimeout(fadeTimer.current);
        fadeTimer.current = null;
      }
    };
  }, [activeId, displayedId]);

  // --- Dev-only singleton invariant: the menu gradient id is global.
  //     If a second MobileHeader ever mounts, the ids collide. ---
  useEffect(() => {
    if (import.meta.env.DEV) {
      const count = document.querySelectorAll('#header-menu-stencil').length;
      if (count > 1) {
        // eslint-disable-next-line no-console
        console.error(
          `[MobileHeader] multiple instances detected (${count}) — ` +
            'menu gradient id collision. The component must be mounted exactly once.'
        );
      }
    }
  }, []);

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

  const chapter = chapters.find((c) => c.id === displayedId);
  const showChapterText = pastHero && phase === 'visible';

  // Chapter text content — rendered exactly once
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

          {/* Menu icon — single instance, painted by shared SVG linearGradient */}
          <button
            className="header-menu"
            onClick={openToc}
            aria-label="Inhaltsverzeichnis"
            aria-expanded={tocOpen}
          >
            <MenuSVG />
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
