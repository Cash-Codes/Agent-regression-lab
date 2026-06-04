'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { RunsList, type RunRow } from './runs-list';

export function ComparableRunsShell({ runs }: { runs: RunRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onCompare = () => {
    if (selected.size !== 2) return;
    const picked = runs.filter((r) => selected.has(r.id));
    const sorted = [...picked].sort(
      (x, y) => x.createdAt.getTime() - y.createdAt.getTime(),
    );
    router.push(`/compare/${sorted[0].id}/${sorted[1].id}`);
  };

  let label: string;
  let disabled: boolean;
  if (selected.size === 0) {
    label = '';
    disabled = true;
  } else if (selected.size === 1) {
    label = 'Select one more run to compare';
    disabled = true;
  } else if (selected.size === 2) {
    label = 'Compare 2 runs';
    disabled = false;
  } else {
    label = 'Select exactly 2 runs';
    disabled = true;
  }

  return (
    <div className="space-y-3">
      <RunsList
        runs={runs}
        selectable
        selectedIds={selected}
        onToggle={toggle}
      />
      {selected.size > 0 ? (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button onClick={onCompare} disabled={disabled}>
            {label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
