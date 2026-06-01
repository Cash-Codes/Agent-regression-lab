import { describe, it, expect } from 'vitest';
import {
  SnapshotToolExecutor,
  SnapshotMiss,
  fixtureKey,
} from './tool-executor';

describe('fixtureKey', () => {
  it('produces stable key under input-key permutation', () => {
    expect(fixtureKey('t', { a: 1, b: 2 })).toBe(
      fixtureKey('t', { b: 2, a: 1 }),
    );
  });

  it('produces different keys for different tools', () => {
    expect(fixtureKey('a', { x: 1 })).not.toBe(fixtureKey('b', { x: 1 }));
  });

  it('produces different keys for different inputs', () => {
    expect(fixtureKey('t', { x: 1 })).not.toBe(fixtureKey('t', { x: 2 }));
  });

  it('key shape is `<toolName>:<64-hex>`', () => {
    expect(fixtureKey('lookup_order', { orderId: 'o-1' })).toMatch(
      /^lookup_order:[a-f0-9]{64}$/,
    );
  });
});

describe('SnapshotToolExecutor', () => {
  it('returns the fixture for a matching key', () => {
    const fixtures = {
      [fixtureKey('lookup_order', { orderId: 'o-1' })]: { status: 'shipped' },
    };
    const exec = new SnapshotToolExecutor(fixtures);
    expect(exec.execute('lookup_order', { orderId: 'o-1' })).toEqual({
      status: 'shipped',
    });
  });

  it('throws SnapshotMiss with the missing key when no fixture matches', () => {
    const exec = new SnapshotToolExecutor({});
    let caught: SnapshotMiss | undefined;
    try {
      exec.execute('lookup_order', { orderId: 'o-1' });
    } catch (err) {
      if (err instanceof SnapshotMiss) caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught!.message).toContain('lookup_order:');
  });
});
