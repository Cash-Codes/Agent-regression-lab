import { z } from 'zod';

const InputsSchema = z.object({}).passthrough();
const FixturesSchema = z.record(z.string(), z.unknown());

export function parseTags(s: string): string[] {
  if (!s) return [];
  return s
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function parseInputsJSON(s: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`inputs: not valid JSON (${message})`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('inputs: expected an object');
  }
  return InputsSchema.parse(parsed) as Record<string, unknown>;
}

export function parseFixturesJSON(s: string): Record<string, unknown> {
  if (!s.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`fixtures: not valid JSON (${message})`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('fixtures: expected an object');
  }
  return FixturesSchema.parse(parsed);
}
