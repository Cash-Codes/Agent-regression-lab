export interface EventRef {
  id: string;
  sequenceNumber: number;
  type: string;
  contentHash: string;
}

export type PairKind = 'match' | 'diverge' | 'onlyA' | 'onlyB';
export type Verdict = 'identical' | 'diverged' | 'length-mismatch';

export interface DiffPair {
  seq: number;
  kind: PairKind;
  a: EventRef | null;
  b: EventRef | null;
}

export interface DiffResult {
  pairs: DiffPair[];
  firstDivergence: number | null;
  verdict: Verdict;
}
