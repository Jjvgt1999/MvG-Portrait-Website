import React, { useEffect, useRef } from 'react';

type PolaroidProps = {
  src: string;
  alt: string;
  caption?: string;
  rotation?: number;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
};

export const Polaroid = React.forwardRef<HTMLElement, PolaroidProps>(
  function Polaroid(
    { src, alt, caption, rotation = 0, width, height, className, eager = false },
    ref
  ) {
    const imgRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
      if (eager && imgRef.current) {
        imgRef.current.setAttribute('fetchpriority', 'high');
      }
    }, [eager]);
    return (
      <figure
        ref={ref}
        className={`polaroid ${className ?? ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            aspectRatio: `${width} / ${height}`,
            width: '100%',
            height: 'auto',
          }}
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }
);
