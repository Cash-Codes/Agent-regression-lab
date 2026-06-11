import { createHash } from 'node:crypto';

export class NonCanonicalValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonCanonicalValueError';
  }
}

export function canonicalJSON(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === 'undefined') return undefined;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new NonCanonicalValueError(
        `Non-canonical number: ${String(value)}`,
      );
    }
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const v = canonicalize(obj[key]);
      if (v !== undefined) sorted[key] = v;
    }
    return sorted;
  }
  return value;
}
