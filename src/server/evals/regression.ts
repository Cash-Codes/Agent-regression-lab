import type { AssertionResult } from './types';

export interface RegressionInfo {
  regressed: boolean;
  regressedAssertionIds: string[];
}

export function detectRegression(
  current: AssertionResult[],
  prior: AssertionResult[] | null,
): RegressionInfo {
  if (prior === null) {
    return { regressed: false, regressedAssertionIds: [] };
  }
  const priorById = new Map<string, boolean>();
  for (const p of prior) {
    priorById.set(p.assertionId, p.passed);
  }
  const regressed: string[] = [];
  for (const c of current) {
    if (
      priorById.has(c.assertionId) &&
      priorById.get(c.assertionId) === true &&
      c.passed === false
    ) {
      regressed.push(c.assertionId);
    }
  }
  return { regressed: regressed.length > 0, regressedAssertionIds: regressed };
}
