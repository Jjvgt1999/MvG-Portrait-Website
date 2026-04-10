type PageMarkerProps = {
  id: string;
  chapterId: string;
  title: string;
};

/**
 * Zero-height anchor for a page inside a chapter.
 * Engine reads these via querySelectorAll('[data-page-id][data-chapter-id=...]').
 */
export function PageMarker({ id, chapterId, title }: PageMarkerProps) {
  return (
    <div
      data-page-id={id}
      data-chapter-id={chapterId}
      data-title={title}
      id={`page-${id}`}
      style={{ position: 'relative', width: 0, height: 0, pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
