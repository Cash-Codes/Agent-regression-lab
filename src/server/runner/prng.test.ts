import { describe, it, expect } from 'vitest';
import { SeededPRNG } from './prng';
import { EventCapture } from '../events/capture';

describe('SeededPRNG', () => {
  it('produces a reproducible sequence for a given seed', () => {
    const a = new SeededPRNG(42);
    const b = new SeededPRNG(42);
    const aSeq = [a.draw(), a.draw(), a.draw(), a.draw()];
    const bSeq = [b.draw(), b.draw(), b.draw(), b.draw()];
    expect(aSeq).toEqual(bSeq);
    expect(aSeq.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededPRNG(1);
    const b = new SeededPRNG(2);
    expect(a.draw()).not.toBe(b.draw());
  });

  it('int(n) returns integers in [0, n)', () => {
    const r = new SeededPRNG(7);
    for (let i = 0; i < 100; i++) {
      const v = r.int(10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('emits runtime.random on each draw when a capture is attached', () => {
    const cap = new EventCapture('run-1');
    const r = new SeededPRNG(42, cap);
    r.draw();
    r.draw();
    expect(cap.eventCount).toBe(2);
  });

  it('emits nothing when no capture is attached', () => {
    const r = new SeededPRNG(42);
    // No capture: just verify draw() returns without throwing
    expect(typeof r.draw()).toBe('number');
  });
});
