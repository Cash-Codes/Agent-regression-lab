import type { Verdict } from '../../types/compare';

const CLASSES: Record<Verdict, string> = {
  identical: 'bg-pill-eval-pass-soft text-pill-eval-pass',
  diverged: 'bg-pill-eval-fail-soft text-pill-eval-fail',
  'length-mismatch': 'bg-pill-tool-soft text-pill-tool',
};

type VerdictPillProps =
  | { verdict: 'identical'; firstDivergence: null; lenA: number; lenB: number }
  | { verdict: 'diverged'; firstDivergence: number; lenA: number; lenB: number }
  | {
      verdict: 'length-mismatch';
      firstDivergence: number;
      lenA: number;
      lenB: number;
    };

export function VerdictPill(props: VerdictPillProps) {
  let copy: string;
  if (props.verdict === 'identical') {
    copy = 'identical · ✓ byte-deterministic';
  } else if (props.verdict === 'diverged') {
    copy = `diverged @ #${props.firstDivergence}`;
  } else {
    copy = `length mismatch · A=${props.lenA} B=${props.lenB}`;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES[props.verdict]}`}
    >
      {copy}
    </span>
  );
}
