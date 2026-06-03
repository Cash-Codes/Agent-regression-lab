'use client';

import { useState } from 'react';

export function ExpandablePayload({ json }: { json: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted hover:text-foreground text-xs"
        aria-expanded={open}
      >
        {open ? '▾ hide payload' : '▸ show payload'}
      </button>
      {open ? (
        <pre className="bg-soft mt-2 overflow-x-auto rounded-md p-3 font-mono text-xs">
          {json}
        </pre>
      ) : null}
    </div>
  );
}
