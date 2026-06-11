import { canonicalJSON, sha256 } from '../events/canonical';
import type { Assertion, AssertionResult } from './types';

type EventRow = { type: string; payload: unknown };

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function lastLLMResponse(events: ReadonlyArray<EventRow>): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === 'llm.response') {
      const p = e.payload as { content?: string };
      return p.content ?? '';
    }
  }
  return null;
}

function computeReplayHashFromEvents(events: ReadonlyArray<EventRow>): string {
  const summary = events.map((e, i) => {
    const ev = e as unknown as {
      type: string;
      payload: unknown;
      contentHash?: string;
      sequenceNumber?: number;
    };
    const hash = ev.contentHash ?? sha256(canonicalJSON(ev.payload ?? null));
    return {
      sequenceNumber: ev.sequenceNumber ?? i,
      type: ev.type,
      contentHash: hash,
    };
  });
  return sha256(canonicalJSON(summary));
}

export function evaluateRun(
  events: ReadonlyArray<EventRow>,
  assertions: Assertion[],
): AssertionResult[] {
  return assertions.map((a) => evaluateOne(events, a));
}

function evaluateOne(
  events: ReadonlyArray<EventRow>,
  a: Assertion,
): AssertionResult {
  try {
    switch (a.type) {
      case 'tool_called': {
        const called = events.some(
          (e) =>
            e.type === 'tool.call' &&
            (e.payload as { toolName?: string }).toolName === a.toolName,
        );
        return called
          ? { assertionId: a.id, passed: true }
          : {
              assertionId: a.id,
              passed: false,
              message: `expected tool '${a.toolName}' to be called, was not`,
            };
      }
      case 'tool_not_called': {
        const called = events.some(
          (e) =>
            e.type === 'tool.call' &&
            (e.payload as { toolName?: string }).toolName === a.toolName,
        );
        return called
          ? {
              assertionId: a.id,
              passed: false,
              message: `expected tool '${a.toolName}' not to be called, was`,
            }
          : { assertionId: a.id, passed: true };
      }
      case 'response_contains': {
        const last = lastLLMResponse(events);
        if (last === null) {
          return {
            assertionId: a.id,
            passed: false,
            message: `no llm.response event found`,
          };
        }
        const haystack = a.caseSensitive ? last : last.toLowerCase();
        const needle = a.caseSensitive
          ? a.substring
          : a.substring.toLowerCase();
        return haystack.includes(needle)
          ? { assertionId: a.id, passed: true }
          : {
              assertionId: a.id,
              passed: false,
              message: `expected response to contain '${a.substring}', got: '${truncate(last, 80)}'`,
            };
      }
      case 'response_matches': {
        const last = lastLLMResponse(events);
        if (last === null) {
          return {
            assertionId: a.id,
            passed: false,
            message: `no llm.response event found`,
          };
        }
        let re: RegExp;
        try {
          re = new RegExp(a.pattern, a.flags);
        } catch (err) {
          return {
            assertionId: a.id,
            passed: false,
            message: `regex compile failed: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
        return re.test(last)
          ? { assertionId: a.id, passed: true }
          : {
              assertionId: a.id,
              passed: false,
              message: `expected response to match /${a.pattern}/${a.flags ?? ''}, got: '${truncate(last, 80)}'`,
            };
      }
      case 'event_count_equals': {
        const actual = events.filter((e) => e.type === a.eventType).length;
        return actual === a.count
          ? { assertionId: a.id, passed: true }
          : {
              assertionId: a.id,
              passed: false,
              message: `expected ${a.count} '${a.eventType}' events, got ${actual}`,
            };
      }
      case 'replay_hash_equals': {
        const computed = computeReplayHashFromEvents(events);
        return computed === a.hash
          ? { assertionId: a.id, passed: true }
          : {
              assertionId: a.id,
              passed: false,
              message: `expected replayHash '${a.hash}', got '${computed}'`,
            };
      }
    }
  } catch (err) {
    return {
      assertionId: a.id,
      passed: false,
      message: `assertion threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
