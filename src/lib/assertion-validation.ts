import { AssertionListSchema } from '../server/evals/types';
import type { Assertion } from '../server/evals/types';

export function parseAssertionsJSON(s: string): Assertion[] {
  if (!s.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`assertions: not valid JSON (${message})`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('assertions: expected an array');
  }
  const result = AssertionListSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`assertions: ${result.error.message}`);
  }
  return result.data;
}
