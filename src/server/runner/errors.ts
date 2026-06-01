export class LiveModeNotImplemented extends Error {
  constructor() {
    super('LIVE mode is not implemented in v1; use SNAPSHOT');
    this.name = 'LiveModeNotImplemented';
  }
}

export class MaxIterationsExceeded extends Error {
  constructor(public readonly maxIterations: number) {
    super(`Agent loop exceeded ${maxIterations} iterations`);
    this.name = 'MaxIterationsExceeded';
  }
}

export { SnapshotMiss } from './tool-executor';
