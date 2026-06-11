import type { DiffPair, DiffResult, EventRef } from '../types/compare';

export function diffRuns(a: EventRef[], b: EventRef[]): DiffResult {
  const len = Math.max(a.length, b.length);
  const pairs: DiffPair[] = [];
  let firstDivergence: number | null = null;

  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? null;
    const bi = b[i] ?? null;
    let kind: DiffPair['kind'];
    if (ai && bi) {
      kind = ai.contentHash === bi.contentHash ? 'match' : 'diverge';
    } else if (ai) {
      kind = 'onlyA';
    } else {
      kind = 'onlyB';
    }
    if (firstDivergence === null && kind !== 'match') {
      firstDivergence = i;
    }
    pairs.push({ seq: i, kind, a: ai, b: bi });
  }

  let verdict: DiffResult['verdict'];
  if (firstDivergence === null) {
    verdict = a.length === b.length ? 'identical' : 'length-mismatch';
  } else {
    const allTailKinds = pairs
      .slice(firstDivergence)
      .every((p) => p.kind === 'onlyA' || p.kind === 'onlyB');
    verdict =
      allTailKinds && firstDivergence > 0 ? 'length-mismatch' : 'diverged';
  }

  return { pairs, firstDivergence, verdict };
}
