import type { EventCapture } from '../events/capture';

export class FrozenClock {
  constructor(
    private readonly capture: EventCapture,
    startMs?: number,
  ) {
    if (startMs !== undefined && startMs > 0) {
      capture.tick(startMs);
    }
  }

  now(): number {
    return this.capture.currentLogicalClock();
  }

  advance(ms: number): void {
    this.capture.tick(ms);
    this.capture.emit('runtime.time', { logicalMs: this.now() });
  }
}
