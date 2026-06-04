import { describe, it, expect } from 'vitest';
import { diffRuns } from './diff';
import type { EventRef } from '../types/compare';

function ev(seq: number, type: string, hash: string): EventRef {
  return {
    id: `${type}-${seq}-${hash}`,
    sequenceNumber: seq,
    type,
    contentHash: hash,
  };
}

describe('diffRuns', () => {
  it('returns identical for empty inputs', () => {
    const r = diffRuns([], []);
    expect(r.verdict).toBe('identical');
    expect(r.firstDivergence).toBeNull();
    expect(r.pairs).toEqual([]);
  });

  it('returns identical when both runs are equal hash-by-hash and same length', () => {
    const a = [ev(0, 'llm.request', 'x'), ev(1, 'llm.response', 'y')];
    const b = [ev(0, 'llm.request', 'x'), ev(1, 'llm.response', 'y')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('identical');
    expect(r.firstDivergence).toBeNull();
    expect(r.pairs).toHaveLength(2);
    expect(r.pairs.every((p) => p.kind === 'match')).toBe(true);
  });

  it('returns length-mismatch when prefix matches and A is longer', () => {
    const a = [ev(0, 'x', '1'), ev(1, 'y', '2')];
    const b = [ev(0, 'x', '1')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('length-mismatch');
    expect(r.firstDivergence).toBe(1);
    expect(r.pairs[1].kind).toBe('onlyA');
  });

  it('returns length-mismatch when prefix matches and B is longer', () => {
    const a = [ev(0, 'x', '1')];
    const b = [ev(0, 'x', '1'), ev(1, 'y', '2')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('length-mismatch');
    expect(r.firstDivergence).toBe(1);
    expect(r.pairs[1].kind).toBe('onlyB');
  });

  it('returns diverged at #0 when first hashes differ', () => {
    const a = [ev(0, 'llm.request', 'a')];
    const b = [ev(0, 'llm.request', 'b')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('diverged');
    expect(r.firstDivergence).toBe(0);
    expect(r.pairs[0].kind).toBe('diverge');
  });

  it('returns diverged at #N where N > 0 with matching prefix', () => {
    const a = [ev(0, 'x', '1'), ev(1, 'y', '2'), ev(2, 'z', '3')];
    const b = [ev(0, 'x', '1'), ev(1, 'y', '2'), ev(2, 'z', 'OTHER')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('diverged');
    expect(r.firstDivergence).toBe(2);
    expect(r.pairs[2].kind).toBe('diverge');
  });

  it('produces only-A or only-B rows when one side is entirely empty', () => {
    const a = [ev(0, 'x', '1'), ev(1, 'y', '2')];
    const r = diffRuns(a, []);
    expect(r.verdict).toBe('diverged');
    expect(r.firstDivergence).toBe(0);
    expect(r.pairs.every((p) => p.kind === 'onlyA')).toBe(true);
  });

  it('keeps later pairs marked as diverge after a mid-stream mismatch', () => {
    const a = [ev(0, 'x', '1'), ev(1, 'y', '2'), ev(2, 'z', '3')];
    const b = [ev(0, 'x', '1'), ev(1, 'y', 'X'), ev(2, 'z', '3')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('diverged');
    expect(r.firstDivergence).toBe(1);
    expect(r.pairs[1].kind).toBe('diverge');
    expect(r.pairs[2].kind).toBe('match');
  });

  it('verdict stays diverged when mid-stream diverge is followed by a one-sided tail', () => {
    const a = [ev(0, 'x', '1'), ev(1, 'y', 'A')];
    const b = [ev(0, 'x', '1'), ev(1, 'y', 'B'), ev(2, 'z', '3')];
    const r = diffRuns(a, b);
    expect(r.verdict).toBe('diverged');
    expect(r.firstDivergence).toBe(1);
    expect(r.pairs[1].kind).toBe('diverge');
    expect(r.pairs[2].kind).toBe('onlyB');
  });
});
