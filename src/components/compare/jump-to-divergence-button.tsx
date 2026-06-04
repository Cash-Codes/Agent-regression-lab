'use client';

export function JumpToDivergenceButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const target = document.getElementById('first-divergence-marker');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }}
      className="border-border bg-background text-muted hover:bg-soft rounded-md border px-2.5 py-0.5 text-xs"
    >
      Jump to divergence
    </button>
  );
}
