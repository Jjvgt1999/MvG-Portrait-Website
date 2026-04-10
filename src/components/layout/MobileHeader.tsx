import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';

/**
 * Layer 3: Transparent header chrome with dual foreground layers.
 *
 * Each visible element (chapter text, menu icon) renders two stacked
 * color versions — one for the top surface, one for the bottom surface.
 * Both are clipped at --header-boundary-px-local so the color split
 * aligns with the occluder's surface split.
 *
 * NO color transitions. The boundary moves with scroll geometry.
 */

function MenuSVG() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

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

  // Chapter text content (rendered twice — top layer + bottom layer)
  const chapterLabel = chapter?.label || '';
  const chapterTitle = chapter?.title || '';

  return (
    <>
      {/* Layer 3: transparent header chrome */}
      <header id="site-header">
        <div className="header-row">
          {/* Chapter text — dual foreground layers */}
          <div
            className="header-chapter-wrap"
            data-visible={showChapterText ? 'true' : 'false'}
          >
            <span className="header-layer header-layer-top chapter-top">
              {chapterLabel && (
                <span className="header-chapter-label">{chapterLabel}</span>
              )}
              <span className="header-chapter-title">{chapterTitle}</span>
            </span>
            <span className="header-layer header-layer-bottom chapter-bottom">
              {chapterLabel && (
                <span className="header-chapter-label">{chapterLabel}</span>
              )}
              <span className="header-chapter-title">{chapterTitle}</span>
            </span>
          </div>

          {/* Menu icon — dual foreground layers */}
          <button
            className="header-menu"
            onClick={openToc}
            aria-label="Inhaltsverzeichnis"
            aria-expanded={tocOpen}
          >
            <span className="header-menu-wrap">
              <span className="header-layer header-layer-top menu-top">
                <MenuSVG />
              </span>
              <span className="header-layer header-layer-bottom menu-bottom">
                <MenuSVG />
              </span>
            </span>
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
