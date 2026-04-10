import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';
import { scrollEngine } from '@/engine/scroll-engine';
import type { HeaderSVGStops } from '@/engine/scroll-engine';
import { getViewportW, watchViewport } from '@/engine/viewport';
import { SURFACE_FG, SURFACE_CHAPTER } from '@/engine/header-theme';

/**
 * SVG header foreground overlay.
 *
 * One SVG containing chapter label, chapter title, and menu icon.
 * All elements are painted from two shared <linearGradient> definitions
 * driven by the boundary engine. No duplicated layers, no clip-path.
 *
 * The SVG is purely visual. An invisible HTML <button> overlays the
 * menu icon area for interaction and accessibility.
 */

const HEADER_ROW_H = 48;
/** Default foreground color (paper surface). */
const DEFAULT_FG = SURFACE_FG['paper'];
/** Default chapter color (paper surface). */
const DEFAULT_CH = SURFACE_CHAPTER['paper'];

export function MobileHeaderSVG() {
  const activeId = useEngine((s) => s.activeChapterId);
  const pastHero = useEngine((s) => s.pastHero);

  // --- Viewport width for explicit SVG coordinate system ---
  const [vw, setVw] = useState(getViewportW);
  useEffect(() => {
    const unsub = watchViewport((next) => setVw(next.w));
    return unsub;
  }, []);

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

  // --- SVG gradient stop refs ---
  const fgStop0 = useRef<SVGStopElement>(null);
  const fgStop1 = useRef<SVGStopElement>(null);
  const fgStop2 = useRef<SVGStopElement>(null);
  const fgStop3 = useRef<SVGStopElement>(null);
  const chStop0 = useRef<SVGStopElement>(null);
  const chStop1 = useRef<SVGStopElement>(null);
  const chStop2 = useRef<SVGStopElement>(null);
  const chStop3 = useRef<SVGStopElement>(null);

  useEffect(() => {
    if (
      !fgStop0.current || !fgStop1.current ||
      !fgStop2.current || !fgStop3.current ||
      !chStop0.current || !chStop1.current ||
      !chStop2.current || !chStop3.current
    ) return;

    const stops: HeaderSVGStops = {
      fgStops: [fgStop0.current, fgStop1.current, fgStop2.current, fgStop3.current],
      chapterStops: [chStop0.current, chStop1.current, chStop2.current, chStop3.current],
    };
    scrollEngine.registerHeaderSVGStops(stops);
    return () => scrollEngine.unregisterHeaderSVGStops();
  }, []);

  // --- Finalize SVG text baselines after font load ---
  const [baselines, setBaselines] = useState({ label: 19, title: 33 });
  useEffect(() => {
    // Fine-tune baselines once EB Garamond is available
    document.fonts.ready.then(() => {
      // Measure a temporary SVG text to find exact baselines
      // For now, use empirically-derived values; refine if needed
      setBaselines({ label: 19, title: 33 });
    });
  }, []);

  // --- Derived content ---
  const chapter = chapters.find((c) => c.id === displayedId);
  const showChapterText = pastHero && phase === 'visible';
  const chapterLabel = chapter?.label || '';
  const chapterTitle = (chapter?.title || '').toUpperCase();

  // Menu icon position: right-aligned with explicit numeric coordinates
  // 14px padding from right, 44px hit area, icon 20x16 centered in that area
  const menuIconX = vw - 14 - 22 - 10; // center of hit area minus half icon width
  const menuIconY = (HEADER_ROW_H - 16) / 2; // center 16px icon in 48px row

  return (
    <>
      {/* SVG foreground overlay — visual only, no pointer events */}
      <svg
        id="header-svg"
        viewBox={`0 0 ${vw} ${HEADER_ROW_H}`}
        width="100%"
        height={HEADER_ROW_H}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Foreground gradient: icons + chapter title */}
          <linearGradient
            id="fg-paint"
            gradientUnits="userSpaceOnUse"
            x1="0" y1="0" x2="0" y2={HEADER_ROW_H}
          >
            <stop ref={fgStop0} offset="0" stopColor={DEFAULT_FG} />
            <stop ref={fgStop1} offset="1" stopColor={DEFAULT_FG} />
            <stop ref={fgStop2} offset="1" stopColor={DEFAULT_FG} />
            <stop ref={fgStop3} offset="1" stopColor={DEFAULT_FG} />
          </linearGradient>

          {/* Chapter label gradient */}
          <linearGradient
            id="chapter-paint"
            gradientUnits="userSpaceOnUse"
            x1="0" y1="0" x2="0" y2={HEADER_ROW_H}
          >
            <stop ref={chStop0} offset="0" stopColor={DEFAULT_CH} />
            <stop ref={chStop1} offset="1" stopColor={DEFAULT_CH} />
            <stop ref={chStop2} offset="1" stopColor={DEFAULT_CH} />
            <stop ref={chStop3} offset="1" stopColor={DEFAULT_CH} />
          </linearGradient>
        </defs>

        {/* Chapter text group — fades on chapter change */}
        <g
          className="chapter-text-group"
          opacity={showChapterText ? 1 : 0}
        >
          {/* Chapter label (italic) */}
          {chapterLabel && (
            <text
              x={vw / 2}
              y={baselines.label}
              textAnchor="middle"
              fill="url(#chapter-paint)"
              fontFamily="'EB Garamond', Georgia, serif"
              fontStyle="italic"
              fontSize="13.6"
              letterSpacing="0.14"
            >
              {chapterLabel}
            </text>
          )}

          {/* Chapter title (uppercase, dimmed) */}
          <text
            x={vw / 2}
            y={baselines.title}
            textAnchor="middle"
            fill="url(#fg-paint)"
            fontFamily="'EB Garamond', Georgia, serif"
            fontSize="10.4"
            letterSpacing="0.83"
            opacity={0.65}
          >
            {chapterTitle}
          </text>
        </g>

        {/* Menu icon — three horizontal lines */}
        <g
          transform={`translate(${menuIconX}, ${menuIconY})`}
          stroke="url(#fg-paint)"
          strokeWidth="1.5"
          fill="none"
        >
          <line x1="0" y1="1" x2="20" y2="1" />
          <line x1="0" y1="8" x2="20" y2="8" />
          <line x1="0" y1="15" x2="20" y2="15" />
        </g>
      </svg>

      {/* Invisible HTML button for menu interaction + accessibility */}
      <button
        id="header-menu-btn"
        onClick={openToc}
        aria-label="Inhaltsverzeichnis"
        aria-expanded={tocOpen}
      />

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
