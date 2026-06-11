import type { EventCapture } from '../events/capture';

export class SeededPRNG {
  private state: number;

  constructor(
    seed: number,
    private readonly capture?: EventCapture,
  ) {
    this.state = seed >>> 0;
  }

  draw(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this.capture?.emit('runtime.random', { value, source: 'prng' });
    return value;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.draw() * maxExclusive);
  }
}
