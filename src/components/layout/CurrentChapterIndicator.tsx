import { useEffect, useRef, useState } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { chapters } from '@/data/chapters';

/**
 * Fixed top-right text indicator showing the current chapter.
 * Always visible once we've scrolled past the hero.
 * Fades smoothly on chapter change (300ms out → text swap → fade in).
 *
 * The editorial layout has no header bar — this is the only persistent
 * chrome besides the right-edge timeline.
 */
export function CurrentChapterIndicator() {
  const activeId = useEngine((s) => s.activeChapterId);
  const pastHero = useEngine((s) => s.pastHero);
  const zoomMode = useEngine((s) => s.zoomMode);

  // Displayed chapter lags behind activeId by one fade-out cycle
  const [displayedId, setDisplayedId] = useState(activeId);
  const [phase, setPhase] = useState<'visible' | 'fading-out'>('visible');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeId === displayedId) return;
    // Begin fade-out. After the transition ends, swap text and fade back in.
    setPhase('fading-out');
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setDisplayedId(activeId);
      setPhase('visible');
      timerRef.current = null;
    }, 360);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeId, displayedId]);

  const chapter = chapters.find((c) => c.id === displayedId);
  // Hide indicator while zooming — the zoomed UI has its own affordances
  const effectivelyVisible =
    pastHero && phase === 'visible' && zoomMode === 'idle';

  if (!chapter) return null;

  return (
    <div
      className="current-chapter-indicator"
      data-visible={effectivelyVisible ? 'true' : 'false'}
      aria-live="polite"
    >
      {chapter.label && <span className="cci-label">{chapter.label}</span>}
      <span className="cci-title">{chapter.title}</span>
    </div>
  );
}
