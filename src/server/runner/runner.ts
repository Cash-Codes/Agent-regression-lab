import { prisma } from '../db/client';
import { sha256 } from '../events/canonical';
import { EventCapture } from '../events/capture';
import type { ChatMessage, LLMClient, ToolDefinition } from '../llm/types';
import { MockLLMClient, type CannedResponse } from '../llm/mock';
import { withCapture } from '../llm/capture';
import { LiveModeNotImplemented } from './errors';
import { runAgentLoop } from './agent-loop';
import { SnapshotToolExecutor } from './tool-executor';
import { FrozenClock } from './clock';
import { SeededPRNG } from './prng';

export interface RunScenarioOpts {
  scenarioId: string;
  mode?: 'SNAPSHOT' | 'LIVE';
  label?: string;
  modelConfig?: {
    model?: string;
    temperature?: number;
    promptVersion?: string;
  };
  llmClient?: LLMClient;
  seed?: number;
  maxIterations?: number;
}

export interface RunScenarioResult {
  runId: string;
  replayHash: string;
  status: 'COMPLETE' | 'FAILED';
  events: number;
  durationMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

interface ScenarioInputs {
  messages?: ChatMessage[];
  user?: string;
  tools?: ToolDefinition[];
  cannedResponses?: CannedResponse[];
}

function hashSeed(runId: string): number {
  return parseInt(sha256(runId).slice(0, 8), 16);
}

function extractInitialMessages(inputs: ScenarioInputs): ChatMessage[] {
  if (inputs.messages?.length) return inputs.messages;
  if (inputs.user) return [{ role: 'user', content: inputs.user }];
  return [];
}

function aggregateLLMTotals(events: { type: string; payload: unknown }[]): {
  in: number;
  out: number;
  cost: number | null;
} {
  let tin = 0;
  let tout = 0;
  let cost: number | null = null;
  for (const e of events) {
    if (e.type !== 'llm.response') continue;
    const p = e.payload as {
      tokensIn?: number;
      tokensOut?: number;
      costUsd?: number;
    };
    tin += p.tokensIn ?? 0;
    tout += p.tokensOut ?? 0;
    if (typeof p.costUsd === 'number') {
      cost = (cost ?? 0) + p.costUsd;
    }
  }
  return { in: tin, out: tout, cost };
}

export async function runScenario(
  opts: RunScenarioOpts,
): Promise<RunScenarioResult> {
  const mode = opts.mode ?? 'SNAPSHOT';
  if (mode === 'LIVE') {
    throw new LiveModeNotImplemented();
  }

  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: opts.scenarioId },
  });
  const inputs = (scenario.inputs ?? {}) as ScenarioInputs;
  const fixtures = (scenario.fixtures ?? {}) as Record<string, unknown>;

  const run = await prisma.run.create({
    data: {
      scenarioId: scenario.id,
      label: opts.label ?? undefined,
      model: opts.modelConfig?.model ?? 'mock',
      promptVersion: opts.modelConfig?.promptVersion ?? undefined,
      temperature: opts.modelConfig?.temperature ?? undefined,
      mode: 'SNAPSHOT',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  const startedAt = Date.now();
  const capture = new EventCapture(run.id);
  // PRNG + clock are instantiated for side effects (event capture).
  // The agent itself can read them if it wants; for the v1 mock agent
  // they're available but unused.
  void new FrozenClock(capture);
  void new SeededPRNG(opts.seed ?? hashSeed(run.id), capture);

  const baseLLM =
    opts.llmClient ??
    (inputs.cannedResponses?.length
      ? new MockLLMClient(inputs.cannedResponses)
      : new MockLLMClient());
  const llm = withCapture(baseLLM, capture);
  const executor = new SnapshotToolExecutor(fixtures);

  try {
    const { finalResponse, iterations } = await runAgentLoop({
      llm,
      executor,
      capture,
      initialMessages: extractInitialMessages(inputs),
      toolDefinitions: inputs.tools,
      maxIterations: opts.maxIterations ?? 10,
      model: opts.modelConfig?.model,
    });
    void iterations;
    void finalResponse;

    const { replayHash } = await capture.flush(prisma);

    // Re-read just enough to aggregate token totals (also confirms persistence).
    const persisted = await prisma.event.findMany({
      where: { runId: run.id },
      orderBy: { sequenceNumber: 'asc' },
    });
    const totals = aggregateLLMTotals(persisted);

    const durationMs = Date.now() - startedAt;

    await prisma.run.update({
      where: { id: run.id },
      data: {
        totalTokensIn: totals.in,
        totalTokensOut: totals.out,
        totalCostUsd: totals.cost,
        durationMs,
      },
    });

    return {
      runId: run.id,
      replayHash,
      status: 'COMPLETE',
      events: capture.eventCount,
      durationMs,
      totalTokensIn: totals.in,
      totalTokensOut: totals.out,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await capture
      .flush(prisma, { finalStatus: 'FAILED', error: message })
      .catch(() => {
        /* best-effort persist; surface original error */
      });
    throw err;
  }
}
