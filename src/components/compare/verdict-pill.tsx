import type { Verdict } from '../../types/compare';

const CLASSES: Record<Verdict, string> = {
  identical: 'bg-pill-eval-pass-soft text-pill-eval-pass',
  diverged: 'bg-pill-eval-fail-soft text-pill-eval-fail',
  'length-mismatch': 'bg-pill-tool-soft text-pill-tool',
};

export function VerdictPill({
  verdict,
  firstDivergence,
  lenA,
  lenB,
}: {
  verdict: Verdict;
  firstDivergence: number | null;
  lenA: number;
  lenB: number;
}) {
  let copy: string;
  if (verdict === 'identical') {
    copy = 'identical · ✓ byte-deterministic';
  } else if (verdict === 'diverged') {
    copy = `diverged @ #${firstDivergence}`;
  } else {
    copy = `length mismatch · A=${lenA} B=${lenB}`;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES[verdict]}`}
    >
      {copy}
    </span>
  );
}
