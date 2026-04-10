type StickyImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Section background color. Defaults to 'ink'. */
  background?: 'ink' | 'dust';
  /** Caption below the image. */
  caption?: string;
};

/**
 * Dark/grey section with a centered image (not full-bleed, not sticky).
 * The image is kept at a moderate size — similar to the hero polaroid.
 * Has its own bg-section-* class so the mobile header strip picks it up.
 */
export function StickyImage({
  src,
  alt,
  width,
  height,
  background = 'ink',
  caption,
}: StickyImageProps) {
  return (
    <section className={`image-break-section bg-section-${background}`} data-surface={background}>
      <div className="image-break-inner">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="image-break-photo"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
        {caption && (
          <p className="image-break-caption">{caption}</p>
        )}
      </div>
    </section>
  );
}
