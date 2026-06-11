import { describe, it, expect } from 'vitest';
import { parseAssertionsJSON } from './assertion-validation';

describe('parseAssertionsJSON', () => {
  it('returns [] for empty string', () => {
    expect(parseAssertionsJSON('')).toEqual([]);
  });

  it('returns [] for explicit []', () => {
    expect(parseAssertionsJSON('[]')).toEqual([]);
  });

  it('accepts a valid assertion list', () => {
    const out = parseAssertionsJSON(
      '[{"id":"a","type":"tool_called","toolName":"lookup"}]',
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a');
  });

  it('throws a friendly error on invalid JSON', () => {
    expect(() => parseAssertionsJSON('{ not valid')).toThrow(/not valid JSON/);
  });

  it('throws when shape is wrong', () => {
    expect(() =>
      parseAssertionsJSON('[{"id":"a","type":"tool_called"}]'),
    ).toThrow(/assertions/);
  });

  it('throws when payload is not an array', () => {
    expect(() => parseAssertionsJSON('{"id":"a"}')).toThrow(/array/);
  });
});
