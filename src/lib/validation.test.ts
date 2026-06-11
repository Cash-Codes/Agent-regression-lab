import { describe, it, expect } from 'vitest';
import { parseTags, parseInputsJSON, parseFixturesJSON } from './validation';

describe('parseTags', () => {
  it('returns [] for empty string', () => {
    expect(parseTags('')).toEqual([]);
  });

  it('splits comma-separated values and trims whitespace', () => {
    expect(parseTags('demo, refund , flow')).toEqual([
      'demo',
      'refund',
      'flow',
    ]);
  });

  it('filters empty entries from trailing commas', () => {
    expect(parseTags('a,,b,')).toEqual(['a', 'b']);
  });
});

describe('parseInputsJSON', () => {
  it('accepts an empty object', () => {
    expect(parseInputsJSON('{}')).toEqual({});
  });

  it('accepts a user string', () => {
    expect(parseInputsJSON('{ "user": "hi" }')).toEqual({ user: 'hi' });
  });

  it('accepts messages array', () => {
    const out = parseInputsJSON(
      '{ "messages": [{ "role": "user", "content": "hi" }] }',
    );
    expect(out.messages).toHaveLength(1);
  });

  it('throws a friendly error on invalid JSON', () => {
    expect(() => parseInputsJSON('{ unterminated')).toThrow(/not valid JSON/);
  });

  it('throws on non-object payload', () => {
    expect(() => parseInputsJSON('[1, 2, 3]')).toThrow(/object/);
  });
});

describe('parseFixturesJSON', () => {
  it('accepts an empty object', () => {
    expect(parseFixturesJSON('{}')).toEqual({});
  });

  it('accepts a record-shaped payload', () => {
    expect(parseFixturesJSON('{ "k": "v" }')).toEqual({ k: 'v' });
  });

  it('returns {} for empty string', () => {
    expect(parseFixturesJSON('')).toEqual({});
  });

  it('throws on invalid JSON', () => {
    expect(() => parseFixturesJSON('not json')).toThrow(/not valid JSON/);
  });

  it('throws on array payload', () => {
    expect(() => parseFixturesJSON('[1, 2]')).toThrow(/object/);
  });
});
