import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';

/**
 * Layer 3: Transparent header chrome with dual full-pass foreground.
 *
 * Two full header passes render the complete UI (chapter text + menu icon).
 * Each pass is clipped at --header-boundary-px-global — the SAME global
 * boundary line that drives the occluder gradient split.
 *
 * header-pass-top: visible above the boundary, uses top-surface colors
 * header-pass-bottom: visible below the boundary, uses bottom-surface colors
 *
 * Clipping at the full-pass level (not per element) eliminates font-metric,
 * baseline, and icon-box differences that caused elements to briefly vanish
 * in the previous per-element clip approach.
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

/** A complete header-row with chapter text + menu button. */
function HeaderRowContent({
  chapterLabel,
  chapterTitle,
  showChapterText,
  onOpenToc,
  tocOpen,
}: {
  chapterLabel: string;
  chapterTitle: string;
  showChapterText: boolean;
  onOpenToc: () => void;
  tocOpen: boolean;
}) {
  return (
    <>
      <div
        className="header-chapter-wrap"
        data-visible={showChapterText ? 'true' : 'false'}
      >
        {chapterLabel && (
          <span className="header-chapter-label">{chapterLabel}</span>
        )}
        <span className="header-chapter-title">{chapterTitle}</span>
      </div>

      <button
        className="header-menu"
        onClick={onOpenToc}
        aria-label="Inhaltsverzeichnis"
        aria-expanded={tocOpen}
      >
        <MenuSVG />
      </button>
    </>
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
  const chapterLabel = chapter?.label || '';
  const chapterTitle = chapter?.title || '';

  return (
    <>
      {/* Layer 3: transparent header chrome — two full passes */}
      <header id="site-header">
        {/* Pass 1: top-surface colors, visible above boundary */}
        <div className="header-pass header-pass-top">
          <div className="header-row">
            <HeaderRowContent
              chapterLabel={chapterLabel}
              chapterTitle={chapterTitle}
              showChapterText={showChapterText}
              onOpenToc={openToc}
              tocOpen={tocOpen}
            />
          </div>
        </div>

        {/* Pass 2: bottom-surface colors, visible below boundary */}
        <div className="header-pass header-pass-bottom">
          <div className="header-row">
            <HeaderRowContent
              chapterLabel={chapterLabel}
              chapterTitle={chapterTitle}
              showChapterText={showChapterText}
              onOpenToc={openToc}
              tocOpen={tocOpen}
            />
          </div>
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
