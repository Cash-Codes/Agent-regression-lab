import { describe, it, expect } from 'vitest';
import { canonicalJSON, sha256, NonCanonicalValueError } from './canonical';

describe('canonicalJSON', () => {
  it('sorts object keys deterministically', () => {
    expect(canonicalJSON({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('produces byte-identical output for permuted inputs', () => {
    const a = canonicalJSON({ z: 1, a: { y: 2, b: 3 } });
    const b = canonicalJSON({ a: { b: 3, y: 2 }, z: 1 });
    expect(a).toBe(b);
  });

  it('encodes Date as ISO string', () => {
    expect(canonicalJSON({ t: new Date('2026-05-19T00:00:00Z') })).toBe(
      '{"t":"2026-05-19T00:00:00.000Z"}',
    );
  });

  it('encodes BigInt as string', () => {
    expect(canonicalJSON({ n: 9007199254740993n })).toBe(
      '{"n":"9007199254740993"}',
    );
  });

  it('omits undefined fields in objects', () => {
    expect(canonicalJSON({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('throws NonCanonicalValueError on NaN', () => {
    expect(() => canonicalJSON({ x: NaN })).toThrow(NonCanonicalValueError);
  });

  it('throws NonCanonicalValueError on Infinity', () => {
    expect(() => canonicalJSON({ x: Infinity })).toThrow(
      NonCanonicalValueError,
    );
  });

  it('recursively canonicalizes nested arrays and objects', () => {
    expect(canonicalJSON([{ z: 1, a: 2 }, { c: 3 }])).toBe(
      '[{"a":2,"z":1},{"c":3}]',
    );
  });
});

describe('sha256', () => {
  it('returns hex-encoded sha256', () => {
    expect(sha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
