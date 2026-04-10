import { useEffect, useRef } from 'react';
import { scrollEngine } from '@/engine/scroll-engine';
import { ZoomStage } from '@/components/layout/ZoomStage';
import { TimelineNav, useTimelineRefs } from '@/components/layout/TimelineNav';
import { BlockerLayer } from '@/components/layout/BlockerLayer';
import { TransitionOverlay } from '@/components/layout/TransitionOverlay';
import { CurrentChapterIndicator } from '@/components/layout/CurrentChapterIndicator';
import { SurfaceExtension } from '@/components/layout/SurfaceExtension';
import { MobileHeaderSVG } from '@/components/layout/MobileHeaderSVG';
import { Hero } from '@/components/sections/Hero';
import { OpeningQuote } from '@/components/sections/OpeningQuote';
import { Chapter } from '@/components/sections/Chapter';
import { chapters, CHAPTER_BG } from '@/data/chapters';

export default function App() {
  const zoomStageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timelineRefs = useTimelineRefs();

  useEffect(() => {
    if (!zoomStageRef.current || !contentRef.current || !overlayRef.current) {
      return;
    }
    const zoomStage = zoomStageRef.current;
    const content = contentRef.current;
    const overlay = overlayRef.current;

    void scrollEngine.init({
      zoomStage,
      content,
      overlay,
      timelineRefs: timelineRefs.current,
    });

    return () => {
      scrollEngine.destroy();
    };
  }, [timelineRefs]);

  // Separate introduction from the ordinary chapters so the layout reads right
  const introChapter = chapters.find((c) => c.id === 'intro')!;
  const openingQuoteChapter = chapters.find((c) => c.id === 'opening-quote')!;
  const openingQuoteText = (openingQuoteChapter.pages[0].paragraphs[0] as {
    kind: 'pullquote';
    content: string;
    attribution?: string;
  });

  const bodyChapters = chapters.filter(
    (c) => c.id !== 'intro' && c.id !== 'opening-quote'
  );

  return (
    <>
      <ZoomStage ref={zoomStageRef}>
        <div ref={contentRef} className="zoom-content">
          <Hero />
          <OpeningQuote
            text={openingQuoteText.content}
            attribution={openingQuoteText.attribution}
          />
          <Chapter
            chapter={introChapter}
            background={CHAPTER_BG.intro}
          />
          {bodyChapters.map((c) => (
            <Chapter
              key={c.id}
              chapter={c}
              background={CHAPTER_BG[c.id] ?? 'paper'}
            />
          ))}
        </div>
      </ZoomStage>
      <TransitionOverlay ref={overlayRef} />
      <BlockerLayer />
      <CurrentChapterIndicator />
      <TimelineNav refs={timelineRefs} />
      <SurfaceExtension />
      <MobileHeaderSVG />
    </>
  );
}
