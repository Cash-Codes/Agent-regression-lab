import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { canonicalJSON, sha256 } from './canonical';
import { EventPayloads, type EventType, type PayloadFor } from './types';

export class IllegalStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalStateError';
  }
}

export class EventValidationError extends Error {
  readonly cause: z.ZodError;

  constructor(message: string, cause: z.ZodError) {
    super(message);
    this.name = 'EventValidationError';
    this.cause = cause;
  }
}

interface PendingEvent {
  sequenceNumber: number;
  parentEventId: string | null;
  type: EventType;
  payload: unknown;
  contentHash: string;
  logicalClock: number;
}

export class EventCapture {
  private events: PendingEvent[] = [];
  private nextSeq = 0;
  private logicalClock: number;
  private flushed = false;

  constructor(
    public readonly runId: string,
    logicalClockStart: number = 0,
  ) {
    this.logicalClock = logicalClockStart;
  }

  emit<T extends EventType>(type: T, payload: PayloadFor<T>): void {
    if (this.flushed) {
      throw new IllegalStateError('Cannot emit after flush');
    }
    const schema = EventPayloads[type];
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new EventValidationError(
        `Invalid payload for ${type}: ${parsed.error.message}`,
        parsed.error,
      );
    }
    const canonical = canonicalJSON(parsed.data);
    this.events.push({
      sequenceNumber: this.nextSeq,
      parentEventId: null,
      type,
      payload: parsed.data,
      contentHash: sha256(canonical),
      logicalClock: this.logicalClock,
    });
    this.nextSeq += 1;
  }

  tick(ms: number): void {
    if (ms < 0) {
      throw new RangeError(
        `EventCapture.tick(): ms must be non-negative, got ${ms}`,
      );
    }
    this.logicalClock += ms;
  }

  currentLogicalClock(): number {
    return this.logicalClock;
  }

  get eventCount(): number {
    return this.events.length;
  }

  get pendingEvents(): ReadonlyArray<{
    type: string;
    payload: unknown;
    contentHash: string;
    sequenceNumber: number;
  }> {
    return this.events.map((e) => ({
      type: e.type,
      payload: e.payload,
      contentHash: e.contentHash,
      sequenceNumber: e.sequenceNumber,
    }));
  }

  computeReplayHash(): string {
    const summary = this.events.map((e) => ({
      sequenceNumber: e.sequenceNumber,
      type: e.type,
      contentHash: e.contentHash,
    }));
    return sha256(canonicalJSON(summary));
  }

  async flush(
    prisma: PrismaClient,
    opts?: { finalStatus?: 'COMPLETE' | 'FAILED'; error?: string },
  ): Promise<{ replayHash: string }> {
    if (this.flushed) {
      throw new IllegalStateError('EventCapture has already been flushed');
    }
    const finalStatus = opts?.finalStatus ?? 'COMPLETE';
    const replayHash = this.computeReplayHash();

    try {
      await prisma.$transaction(async (tx) => {
        if (this.events.length > 0) {
          await tx.event.createMany({
            data: this.events.map((e) => ({
              runId: this.runId,
              sequenceNumber: e.sequenceNumber,
              parentEventId: e.parentEventId,
              type: e.type,
              payload: e.payload as never,
              contentHash: e.contentHash,
              logicalClock: e.logicalClock,
            })),
          });
        }
        await tx.run.update({
          where: { id: this.runId },
          data: {
            replayHash,
            status: finalStatus,
            error: opts?.error ?? null,
            finishedAt: new Date(),
          },
        });
      });
      // Only mark flushed on the success path; a failed flush leaves the
      // capture in a state where the caller can retry or discard.
      this.flushed = true;
      return { replayHash };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.run
        .update({
          where: { id: this.runId },
          data: {
            status: 'FAILED',
            error: message,
            finishedAt: new Date(),
          },
        })
        .catch((secondaryErr) => {
          console.warn('EventCapture: failed to mark run FAILED', secondaryErr);
        });
      throw err;
    }
  }
}
