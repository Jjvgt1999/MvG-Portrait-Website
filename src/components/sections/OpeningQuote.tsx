import { SectionMarker } from '../ui/SectionMarker';
import { PageMarker } from '../ui/PageMarker';

type OpeningQuoteProps = {
  text: string;
  attribution?: string;
};

export function OpeningQuote({ text, attribution }: OpeningQuoteProps) {
  return (
    <section
      className="bg-section-ink relative flex items-center justify-center"
      data-surface="ink"
      style={{
        minHeight: '100vh',
        paddingBlock: 'clamp(6rem, 12vh, 12rem)',
      }}
    >
      <SectionMarker id="opening-quote" label="" title="Opening Quote" />
      <PageMarker id="opening-quote-main" chapterId="opening-quote" title="" />
      <blockquote
        className="reading-measure text-center"
        style={{ maxWidth: '44rem' }}
      >
        <p
          className="font-serif italic"
          style={{
            fontSize: 'clamp(1.75rem, 3.6vw, 3.25rem)',
            lineHeight: 1.3,
          }}
        >
          {text}
        </p>
        {attribution && (
          <cite
            className="block mt-12 font-sans not-italic tracking-wideish uppercase"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(245, 241, 232, 0.65)',
            }}
          >
            — {attribution}
          </cite>
        )}
      </blockquote>
    </section>
  );
}
