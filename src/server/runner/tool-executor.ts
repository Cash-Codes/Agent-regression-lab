import { canonicalJSON, sha256 } from '../events/canonical';

export class SnapshotMiss extends Error {
  constructor(public readonly missingKey: string) {
    super(`No fixture for ${missingKey}`);
    this.name = 'SnapshotMiss';
  }
}

export function fixtureKey(toolName: string, input: unknown): string {
  return `${toolName}:${sha256(canonicalJSON(input))}`;
}

export class SnapshotToolExecutor {
  constructor(private readonly fixtures: Record<string, unknown>) {}

  execute(toolName: string, input: unknown): unknown {
    const key = fixtureKey(toolName, input);
    if (!(key in this.fixtures)) {
      throw new SnapshotMiss(key);
    }
    return this.fixtures[key];
  }
}
