'use client';

export function JumpToDivergenceButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const a = document.getElementById('first-divergence-marker-a');
        const b = document.getElementById('first-divergence-marker-b');
        if (a) a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }}
      className="border-border bg-background text-muted hover:bg-soft rounded-md border px-2.5 py-0.5 text-xs"
    >
      Jump to divergence
    </button>
  );
}
