import React from 'react';

/**
 * Full-viewport paper-colored fade used to mask compositing artifacts
 * during zoom enter/exit DOM swaps.
 *
 * Opacity is driven entirely by CSS based on documentElement data attributes:
 *   html[data-zoom-mode="entering"|"exiting"] .transition-overlay { opacity: 1 }
 *   html[data-overlay-phase="unmasking"]     .transition-overlay { opacity: 0 }
 *
 * The engine's ZoomController watches transitionend on this element to
 * sequence its phase machine.
 *
 * A `data-snapshot-slot` div is included as a snapshot-ready extension point
 * for a future compositor-snapshot carrier; currently unused.
 */
export const TransitionOverlay = React.forwardRef<HTMLDivElement>(
  function TransitionOverlay(_props, ref) {
    return (
      <div ref={ref} className="transition-overlay" aria-hidden>
        <div data-snapshot-slot style={{ position: 'absolute', inset: 0 }} />
      </div>
    );
  }
);
