import React from 'react';

type PullQuoteProps = {
  children: React.ReactNode;
  attribution?: string;
};

export function PullQuote({ children, attribution }: PullQuoteProps) {
  return (
    <div className="reading-measure" style={{ paddingBlock: 'clamp(4rem, 12vh, 10rem)' }}>
      <blockquote className="text-center">
        <p className="font-serif italic" style={{ fontSize: 'clamp(1.75rem, 3.2vw, 3rem)', lineHeight: 1.3 }}>
          {children}
        </p>
        {attribution && (
          <cite
            className="block mt-8 font-sans not-italic tracking-wideish uppercase text-dust"
            style={{ fontSize: '0.75rem' }}
          >
            {attribution}
          </cite>
        )}
      </blockquote>
    </div>
  );
}
