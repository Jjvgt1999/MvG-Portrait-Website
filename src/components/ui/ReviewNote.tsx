import type { Provenance } from '@/data/chapters';
import { reviewMode } from '@/data/i18n';

/**
 * Shown only in review mode (?review). Marks passages that are not yet
 * backed by a verified original source, so they cannot slip into launch.
 */
export function ReviewNote({ provenance }: { provenance?: Provenance }) {
  if (!reviewMode) return null;
  const status = provenance?.status ?? 'unverified';
  if (status === 'verified' || status === 'editorial') return null;
  return (
    <p className="review-note reading-measure font-sans">
      <strong>Quelle fehlt.</strong>
      {provenance?.note ? ` ${provenance.note}` : ' Gegen Originalquelle prüfen.'}
    </p>
  );
}
