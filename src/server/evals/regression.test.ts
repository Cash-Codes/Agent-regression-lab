import { describe, it, expect } from 'vitest';
import { detectRegression } from './regression';
import type { AssertionResult } from './types';

const r = (id: string, passed: boolean): AssertionResult => ({
  assertionId: id,
  passed,
});

describe('detectRegression', () => {
  it('returns no regression when prior is null', () => {
    expect(detectRegression([r('a', false)], null)).toEqual({
      regressed: false,
      regressedAssertionIds: [],
    });
  });

  it('returns no regression when both runs all-pass', () => {
    expect(
      detectRegression(
        [r('a', true), r('b', true)],
        [r('a', true), r('b', true)],
      ),
    ).toEqual({ regressed: false, regressedAssertionIds: [] });
  });

  it('returns regression for ids that passed before and fail now', () => {
    expect(
      detectRegression(
        [r('a', false), r('b', true)],
        [r('a', true), r('b', true)],
      ),
    ).toEqual({ regressed: true, regressedAssertionIds: ['a'] });
  });

  it('does NOT regress when prior failed and current also fails', () => {
    expect(detectRegression([r('a', false)], [r('a', false)])).toEqual({
      regressed: false,
      regressedAssertionIds: [],
    });
  });

  it('does NOT regress for ids only in current (new assertion)', () => {
    expect(
      detectRegression([r('a', true), r('b', false)], [r('a', true)]),
    ).toEqual({ regressed: false, regressedAssertionIds: [] });
  });

  it('ignores ids only in prior (removed assertion)', () => {
    expect(
      detectRegression([r('a', true)], [r('a', true), r('b', true)]),
    ).toEqual({ regressed: false, regressedAssertionIds: [] });
  });

  it('reports multiple regressions and preserves current order', () => {
    expect(
      detectRegression(
        [r('a', false), r('b', true), r('c', false)],
        [r('a', true), r('b', true), r('c', true)],
      ),
    ).toEqual({ regressed: true, regressedAssertionIds: ['a', 'c'] });
  });
});
