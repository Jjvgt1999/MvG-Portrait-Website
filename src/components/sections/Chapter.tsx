import type { ChapterData, Paragraph } from '@/data/chapters';
import { SectionMarker } from '../ui/SectionMarker';
import { PageMarker } from '../ui/PageMarker';
import { Polaroid } from '../ui/Polaroid';
import { PullQuote } from '../ui/PullQuote';
import { StickyImage } from '../ui/StickyImage';

type ChapterProps = {
  chapter: ChapterData;
  background: 'paper' | 'ink' | 'dust';
};

export function Chapter({ chapter, background }: ChapterProps) {
  return (
    <section
      className={`bg-section-${background} section-pad relative`}
      data-surface={background}
      style={{ position: 'relative' }}
    >
      <SectionMarker
        id={chapter.id}
        label={chapter.label}
        title={chapter.title}
      />

      <header className="reading-measure mb-16">
        {chapter.label && <p className="year-label mb-6">{chapter.label}</p>}
        <h2 className="font-serif text-headline">{chapter.title}</h2>
        {chapter.intro && (
          <p className="editorial-headline mt-10">{chapter.intro}</p>
        )}
      </header>

      {chapter.pages.map((page, pi) => (
        <div key={page.id} className="chapter-page">
          <PageMarker id={page.id} chapterId={chapter.id} title={page.title} />
          {pi > 0 && page.title && (
            <div className="reading-measure mt-20 mb-8">
              <h3 className="font-serif italic text-2xl text-dust">
                {page.title}
              </h3>
            </div>
          )}
          {page.paragraphs.map((p, i) => (
            <ParagraphBlock key={`${page.id}-${i}`} paragraph={p} />
          ))}
        </div>
      ))}
    </section>
  );
}

function ParagraphBlock({ paragraph }: { paragraph: Paragraph }) {
  if (paragraph.kind === 'text') {
    return (
      <p className="reading-measure font-serif mb-7" style={{ fontSize: '1.25rem', lineHeight: 1.7 }}>
        {paragraph.content}
      </p>
    );
  }
  if (paragraph.kind === 'pullquote') {
    return <PullQuote attribution={paragraph.attribution}>{paragraph.content}</PullQuote>;
  }
  if (paragraph.kind === 'polaroid') {
    return (
      <div className="flex justify-center my-16 px-6">
        <Polaroid
          src={paragraph.src}
          alt={paragraph.alt}
          caption={paragraph.caption}
          width={paragraph.width}
          height={paragraph.height}
          className="max-w-sm w-full"
        />
      </div>
    );
  }
  if (paragraph.kind === 'sticky-image') {
    return (
      <div className="my-20">
        <StickyImage
          src={paragraph.src}
          alt={paragraph.alt}
          width={paragraph.width}
          height={paragraph.height}
          background={paragraph.background}
          caption={paragraph.caption}
        />
      </div>
    );
  }
  return null;
}
