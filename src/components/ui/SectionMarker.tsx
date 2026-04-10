type SectionMarkerProps = {
  id: string;
  label: string;
  title: string;
};

/**
 * Zero-height anchor that the engine's layout-measurements module reads
 * via data attributes to derive chapter geometry.
 */
export function SectionMarker({ id, label, title }: SectionMarkerProps) {
  return (
    <div
      data-chapter-id={id}
      data-label={label}
      data-title={title}
      id={`chapter-${id}`}
      style={{ position: 'absolute', top: 0, width: 0, height: 0, pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
