import { describe, it, expect } from 'vitest';
import { FrozenClock } from './clock';
import { EventCapture } from '../events/capture';

describe('FrozenClock', () => {
  it('now() reads from the attached capture logical clock', () => {
    const cap = new EventCapture('run-1', 500);
    const clock = new FrozenClock(cap);
    expect(clock.now()).toBe(500);
  });

  it('advance(ms) ticks the capture and emits a runtime.time event', () => {
    const cap = new EventCapture('run-1');
    const clock = new FrozenClock(cap);
    clock.advance(250);
    expect(clock.now()).toBe(250);
    expect(cap.eventCount).toBe(1);
  });

  it('advance(0) is a valid no-op but still emits runtime.time', () => {
    const cap = new EventCapture('run-1');
    const clock = new FrozenClock(cap);
    clock.advance(0);
    expect(clock.now()).toBe(0);
    expect(cap.eventCount).toBe(1);
  });

  it('advance(-1) throws via EventCapture.tick guard', () => {
    const cap = new EventCapture('run-1');
    const clock = new FrozenClock(cap);
    expect(() => clock.advance(-1)).toThrow(RangeError);
  });

  it('startMs constructor parameter advances the capture clock without emitting an event', () => {
    const cap = new EventCapture('run-1');
    const clock = new FrozenClock(cap, 1000);
    expect(clock.now()).toBe(1000);
    expect(cap.eventCount).toBe(0);
  });
});
