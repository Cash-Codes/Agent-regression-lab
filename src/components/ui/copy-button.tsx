'use client';

import { useState } from 'react';

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore — clipboard may be blocked
        }
      }}
      className="border-border bg-background text-muted hover:bg-soft rounded-md border px-2 py-0.5 text-xs"
      aria-label="Copy"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
