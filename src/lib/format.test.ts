import { describe, it, expect } from 'vitest';
import {
  shortHash,
  formatDuration,
  formatTokens,
  formatRelativeTime,
} from './format';

describe('shortHash', () => {
  it('returns prefix...suffix for 64-char hex', () => {
    expect(
      shortHash(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      ),
    ).toBe('2cf24dba…9824');
  });

  it('returns the input unchanged when it is shorter than 12 chars', () => {
    expect(shortHash('abc')).toBe('abc');
  });
});

describe('formatDuration', () => {
  it('formats sub-second values in ms', () => {
    expect(formatDuration(234)).toBe('234ms');
  });

  it('formats seconds with two decimals', () => {
    expect(formatDuration(1234)).toBe('1.23s');
  });

  it('formats minutes + seconds for >= 60s', () => {
    expect(formatDuration(72_300)).toBe('1m 12s');
  });

  it('returns "0ms" for 0', () => {
    expect(formatDuration(0)).toBe('0ms');
  });
});

describe('formatTokens', () => {
  it('formats < 1000 as-is', () => {
    expect(formatTokens(342)).toBe('342');
  });

  it('formats >= 1000 in k notation with one decimal', () => {
    expect(formatTokens(15234)).toBe('15.2k');
  });

  it('handles 0', () => {
    expect(formatTokens(0)).toBe('0');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for < 30 seconds', () => {
    const d = new Date(Date.now() - 5_000);
    expect(formatRelativeTime(d)).toBe('just now');
  });

  it('returns "Nm ago" for minutes', () => {
    const d = new Date(Date.now() - 2 * 60_000);
    expect(formatRelativeTime(d)).toBe('2m ago');
  });

  it('returns "Nh ago" for hours', () => {
    const d = new Date(Date.now() - 3 * 60 * 60_000);
    expect(formatRelativeTime(d)).toBe('3h ago');
  });

  it('returns an absolute date for older entries', () => {
    const d = new Date('2026-01-15T00:00:00Z');
    // The exact string depends on locale; just check it contains "Jan"
    expect(formatRelativeTime(d)).toMatch(/Jan/);
  });
});
