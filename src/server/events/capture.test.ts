import { describe, it, expect, vi } from 'vitest';
import {
  EventCapture,
  EventValidationError,
  IllegalStateError,
} from './capture';

// ---------------------------------------------------------------------------
// Fake Prisma — models transactional rollback semantics.
//
// The $transaction callback receives a `tx` proxy whose writes go to a
// staging buffer. On success the staging buffer is merged into the shared
// `events` / `runUpdates` arrays; on throw it is silently discarded (rollback).
//
// When failFlush=true, createMany throws mid-callback so the staging buffer
// is never committed — correctly exercising rollback without any side effects
// reaching the shared arrays.
// ---------------------------------------------------------------------------

type FakePrisma = {
  $transaction: ReturnType<typeof vi.fn>;
  run: { update: ReturnType<typeof vi.fn> };
  _events: unknown[];
  _runUpdates: unknown[];
};

function fakePrisma(failFlush = false): FakePrisma {
  const events: unknown[] = [];
  const runUpdates: unknown[] = [];

  const p = {
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
      // Staging buffers — nothing is committed until the callback succeeds.
      const stagingEvents: unknown[] = [];
      const stagingRunUpdates: unknown[] = [];

      const tx = {
        event: {
          createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
            if (failFlush) throw new Error('simulated tx failure');
            stagingEvents.push(...data);
          }),
        },
        run: {
          update: vi.fn(async ({ data }: { data: unknown }) => {
            stagingRunUpdates.push({ ...(data as object), _inTx: true });
          }),
        },
      };

      // If cb throws, the staging buffers are discarded (rollback).
      await cb(tx);

      // Callback succeeded — flush staging to shared state (commit).
      events.push(...stagingEvents);
      runUpdates.push(...stagingRunUpdates);
    }),
    run: {
      update: vi.fn(async ({ data }: { data: unknown }) => {
        runUpdates.push({ ...(data as object), _outsideTx: true });
      }),
    },
    _events: events,
    _runUpdates: runUpdates,
  };
  return p as FakePrisma;
}

describe('EventCapture', () => {
  it('assigns monotonic sequence numbers starting at 0', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('llm.request', {
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
    });
    cap.emit('runtime.time', { logicalMs: 0 });
    cap.emit('llm.response', {
      model: 'm',
      content: 'ok',
      stopReason: 'end_turn',
      tokensIn: 1,
      tokensOut: 1,
    });
    const p = fakePrisma();
    await cap.flush(p as unknown as never);
    expect(
      (p._events as { sequenceNumber: number }[]).map((e) => e.sequenceNumber),
    ).toEqual([0, 1, 2]);
  });

  it('produces byte-identical replayHash for the same event sequence across captures', async () => {
    const make = () => {
      const c = new EventCapture('run-x');
      c.emit('llm.request', {
        model: 'm',
        messages: [{ role: 'user', content: 'hi' }],
      });
      c.emit('llm.response', {
        model: 'm',
        content: 'ok',
        stopReason: 'end_turn',
        tokensIn: 1,
        tokensOut: 1,
      });
      return c;
    };
    const r1 = await make().flush(fakePrisma() as unknown as never);
    const r2 = await make().flush(fakePrisma() as unknown as never);
    expect(r1.replayHash).toBe(r2.replayHash);
    expect(r1.replayHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects invalid emit synchronously without corrupting queue or sequence', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('llm.request', {
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(() =>
      // messages: [] is valid TypeScript (runtime Zod min(1) rejects it)
      cap.emit('llm.request', { model: 'm', messages: [] }),
    ).toThrow(EventValidationError);
    cap.emit('llm.response', {
      model: 'm',
      content: 'ok',
      stopReason: 'end_turn',
      tokensIn: 1,
      tokensOut: 1,
    });
    const p = fakePrisma();
    await cap.flush(p as unknown as never);
    expect(
      (p._events as { sequenceNumber: number }[]).map((e) => e.sequenceNumber),
    ).toEqual([0, 1]);
  });

  it('marks run FAILED and persists no events when the flush transaction throws', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('llm.request', {
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
    });
    const p = fakePrisma(true);
    await expect(cap.flush(p as unknown as never)).rejects.toThrow(
      'simulated tx failure',
    );
    // Rollback: staging buffer was discarded, shared events array is still empty.
    expect(p._events).toHaveLength(0);
    const outside = (
      p._runUpdates as { status?: string; _outsideTx?: boolean }[]
    ).find((u) => u._outsideTx);
    expect(outside?.status).toBe('FAILED');
  });

  // -------------------------------------------------------------------------
  // Issue 1 — Re-entrancy / post-flush emit guard
  // -------------------------------------------------------------------------

  it('throws IllegalStateError when flush() is called a second time', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('runtime.time', { logicalMs: 0 });
    await cap.flush(fakePrisma() as unknown as never);
    await expect(cap.flush(fakePrisma() as unknown as never)).rejects.toThrow(
      IllegalStateError,
    );
    await expect(cap.flush(fakePrisma() as unknown as never)).rejects.toThrow(
      'EventCapture has already been flushed',
    );
  });

  it('throws IllegalStateError when emit() is called after a successful flush', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('runtime.time', { logicalMs: 0 });
    await cap.flush(fakePrisma() as unknown as never);
    expect(() => cap.emit('runtime.time', { logicalMs: 1 })).toThrow(
      IllegalStateError,
    );
    expect(() => cap.emit('runtime.time', { logicalMs: 1 })).toThrow(
      'Cannot emit after flush',
    );
  });

  // -------------------------------------------------------------------------
  // Issue 2 — EventValidationError carries the underlying ZodError
  // -------------------------------------------------------------------------

  it('attaches ZodError as cause on EventValidationError', () => {
    const cap = new EventCapture('run-1');
    let caught: EventValidationError | undefined;
    try {
      // messages: [] is valid TypeScript (runtime Zod min(1) rejects it)
      cap.emit('llm.request', { model: 'm', messages: [] });
    } catch (err) {
      if (err instanceof EventValidationError) caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught!.cause).toBeDefined();
    expect(Array.isArray(caught!.cause.issues)).toBe(true);
    expect(caught!.cause.issues.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Issue 4 — Silent secondary-update failure logs a warning
  // -------------------------------------------------------------------------

  it('logs a console.warn and rethrows the original error when both the transaction and the secondary run.update fail', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const txError = new Error('simulated tx failure');
    const secondaryError = new Error('secondary update also failed');

    const p = {
      $transaction: vi.fn(async () => {
        throw txError;
      }),
      run: {
        update: vi.fn(async () => {
          throw secondaryError;
        }),
      },
      _events: [],
      _runUpdates: [],
    };

    const cap = new EventCapture('run-warn');
    cap.emit('runtime.time', { logicalMs: 0 });

    await expect(cap.flush(p as unknown as never)).rejects.toThrow(txError);
    expect(warnSpy).toHaveBeenCalledWith(
      'EventCapture: failed to mark run FAILED',
      secondaryError,
    );

    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // tick() — advances the logical clock and refuses negative deltas
  // -------------------------------------------------------------------------

  it('tick() advances logicalClock so subsequent events carry the updated value', async () => {
    const cap = new EventCapture('run-1', 100);
    cap.emit('runtime.time', { logicalMs: 0 });
    cap.tick(50);
    cap.emit('runtime.time', { logicalMs: 1 });

    const p = fakePrisma();
    await cap.flush(p as unknown as never);

    const recorded = p._events as { logicalClock: number }[];
    expect(recorded.map((e) => e.logicalClock)).toEqual([100, 150]);
  });

  it('tick() throws RangeError when given a negative delta', () => {
    const cap = new EventCapture('run-1');
    expect(() => cap.tick(-1)).toThrow(RangeError);
    expect(() => cap.tick(-1)).toThrow(/non-negative/);
  });

  // -------------------------------------------------------------------------
  // Step 2 additive extensions: getters + flush({finalStatus, error})
  // -------------------------------------------------------------------------

  it('exposes currentLogicalClock() that reflects the active logical time', () => {
    const cap = new EventCapture('run-1', 250);
    expect(cap.currentLogicalClock()).toBe(250);
    cap.tick(75);
    expect(cap.currentLogicalClock()).toBe(325);
  });

  it('exposes eventCount that reflects the queued event count', () => {
    const cap = new EventCapture('run-1');
    expect(cap.eventCount).toBe(0);
    cap.emit('runtime.time', { logicalMs: 0 });
    cap.emit('runtime.time', { logicalMs: 1 });
    expect(cap.eventCount).toBe(2);
  });

  it('pendingEvents returns events in emit order and mutating the result does not affect internal state', () => {
    const cap = new EventCapture('run-1');
    cap.emit('runtime.time', { logicalMs: 0 });
    cap.emit('runtime.time', { logicalMs: 1 });

    const events = cap.pendingEvents;
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('runtime.time');
    expect(events[1].type).toBe('runtime.time');

    // Mutate the returned array — internal state must be unaffected.
    (events as unknown as { type: string; payload: unknown }[]).push({
      type: 'injected',
      payload: {},
    });
    expect(cap.eventCount).toBe(2);
    expect(cap.pendingEvents).toHaveLength(2);
  });

  it('flush({ finalStatus: "FAILED", error }) marks run FAILED and persists the events', async () => {
    const cap = new EventCapture('run-1');
    cap.emit('runtime.time', { logicalMs: 0 });
    cap.emit('runtime.time', { logicalMs: 1 });
    const p = fakePrisma();
    await cap.flush(p as unknown as never, {
      finalStatus: 'FAILED',
      error: 'agent crashed',
    });
    // Events still persisted (the trace is useful)
    expect(p._events as unknown[]).toHaveLength(2);
    // Run update happened inside the transaction with FAILED status
    const inTx = (
      p._runUpdates as { status?: string; _inTx?: boolean; error?: string }[]
    ).find((u) => u._inTx);
    expect(inTx?.status).toBe('FAILED');
    expect(inTx?.error).toBe('agent crashed');
  });
});
