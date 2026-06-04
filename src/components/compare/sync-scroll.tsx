'use client';

import { useEffect, useRef, useState } from 'react';

export function SyncScroll({
  paneSelectors,
}: {
  paneSelectors: [string, string];
}) {
  const [enabled, setEnabled] = useState(true);
  const reentry = useRef(false);

  useEffect(() => {
    const [selA, selB] = paneSelectors;
    const a = document.querySelector(selA) as HTMLElement | null;
    const b = document.querySelector(selB) as HTMLElement | null;
    if (!a || !b) return;

    const onA = () => {
      if (!enabled) return;
      if (reentry.current) {
        reentry.current = false;
        return;
      }
      reentry.current = true;
      b.scrollTop = a.scrollTop;
    };
    const onB = () => {
      if (!enabled) return;
      if (reentry.current) {
        reentry.current = false;
        return;
      }
      reentry.current = true;
      a.scrollTop = b.scrollTop;
    };

    a.addEventListener('scroll', onA, { passive: true });
    b.addEventListener('scroll', onB, { passive: true });
    return () => {
      a.removeEventListener('scroll', onA);
      b.removeEventListener('scroll', onB);
    };
  }, [paneSelectors, enabled]);

  return (
    <label className="text-muted flex items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        className="h-3.5 w-3.5"
      />
      Sync scroll
    </label>
  );
}
