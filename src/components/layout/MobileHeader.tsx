import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';

/**
 * Layer 3: Single-pass SVG header foreground.
 *
 * One inline SVG spans the full header zone. Every visible element
 * (chapter label, chapter title, menu icon) exists exactly once,
 * painted by shared hard-stop linearGradients whose stop-colors
 * are driven by CSS custom properties and whose stop offsets are
 * set imperatively by the scroll engine per frame.
 *
 * NO dual-pass clipping. NO duplicate DOM copies.
 * NO color transitions. The boundary moves with scroll geometry.
 */

/**
 * Memoised gradient defs — the engine updates stop offsets + gradient y2
 * imperatively; React.memo ensures these DOM nodes are never reconciled
 * back to initial values. Stop colors are driven by CSS custom properties.
 */
const HeaderGradients = memo(function HeaderGradients() {
  return (
    <defs>
      <linearGradient
        id="header-fg-gradient"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="0"
        y2="48"
      >
        <stop id="fg-stop-1" offset="0%" />
        <stop id="fg-stop-2" offset="100%" />
        <stop id="fg-stop-3" offset="100%" />
        <stop id="fg-stop-4" offset="100%" />
      </linearGradient>
      <linearGradient
        id="header-chapter-gradient"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="0"
        y2="48"
      >
        <stop id="chapter-stop-1" offset="0%" />
        <stop id="chapter-stop-2" offset="100%" />
        <stop id="chapter-stop-3" offset="100%" />
        <stop id="chapter-stop-4" offset="100%" />
      </linearGradient>
    </defs>
  );
});

/**
 * Memoised menu icon — transform is set by the engine on init/resize;
 * React.memo prevents reconciliation from resetting it.
 */
const HeaderMenuIcon = memo(function HeaderMenuIcon() {
  return (
    <g
      id="header-menu-icon"
      stroke="url(#header-fg-gradient)"
      fill="none"
      strokeWidth="1.5"
    >
      <line x1="0" y1="1" x2="20" y2="1" />
      <line x1="0" y1="8" x2="20" y2="8" />
      <line x1="0" y1="15" x2="20" y2="15" />
    </g>
  );
});

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

  const chapterLabel = chapter?.label || '';
  const chapterTitle = (chapter?.title || '').toUpperCase();

  return (
    <>
      {/* Layer 3: single-pass SVG header foreground */}
      <header id="site-header" aria-label="Site header">
        <svg
          id="header-fg-svg"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          data-chapter-visible={showChapterText ? 'true' : 'false'}
        >
          <HeaderGradients />

          {/* Chapter text — single instance, fade via CSS on <g> */}
          <g id="header-chapter-group">
            <text
              id="header-chapter-label"
              fill="url(#header-chapter-gradient)"
              textAnchor="middle"
              x="50%"
              dominantBaseline="auto"
              fontFamily="'EB Garamond', Georgia, serif"
              fontStyle="italic"
              fontSize="13.6"
              letterSpacing="0.01em"
            >
              {chapterLabel}
            </text>
            <text
              id="header-chapter-title"
              fill="url(#header-fg-gradient)"
              textAnchor="middle"
              x="50%"
              dominantBaseline="auto"
              fontFamily="'EB Garamond', Georgia, serif"
              fontSize="10.4"
              letterSpacing="0.08em"
              opacity="0.65"
            >
              {chapterTitle}
            </text>
          </g>

          <HeaderMenuIcon />
        </svg>

        {/* Invisible HTML hit targets — accessibility + pointer events */}
        <button
          className="header-hit-target header-hit-target-menu"
          onClick={openToc}
          aria-label="Inhaltsverzeichnis"
          aria-expanded={tocOpen}
        />
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
