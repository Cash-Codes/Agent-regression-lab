# 🧪 Agent Regression Lab

Deterministic testing and regression infrastructure for LLM agent systems. Records every LLM call, tool call and runtime observation so an agent run can be replayed identically, evaluated against typed assertions and diffed event-by-event against any prior run on the same scenario.

LLM agents have logs and traces, but no CI/CD-grade regression testing. Agent Regression Lab fills that gap - think **git diff for agents**, not another observability dashboard.

The interesting layer is everything around the LLM call: canonical-JSON-hashed event content (`contentHash` per event, `replayHash` per run), a seeded PRNG and frozen logical clock so randomness and time replay deterministically, a snapshot tool executor keyed on `(toolName, sha256(canonicalJSON(input)))`, an assertion DSL that runs over the in-memory event stream before flush and an overlap-only regression detector that compares each new run against its immediate predecessor.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](#)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](#)
[![Zod](https://img.shields.io/badge/Zod-4-3068B7?style=flat&logo=zod&logoColor=white)](#)
[![Anthropic](https://img.shields.io/badge/Claude-Haiku_4.5-D97706?style=flat&logo=anthropic&logoColor=white)](#)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=flat&logo=vitest&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](#)
[![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?style=flat&logo=googlecloud&logoColor=white)](#)

## 🌐 Live Demo

🔗 https://agent-regression-lab-768962821576.europe-west2.run.app

The deployed instance will run without an `ANTHROPIC_API_KEY`, so the agent loop will fall back to `MockLLMClient` and the seeded **Refund flow** scenario (`/scenarios`) will demonstrate replay, evaluations and side-by-side compare end-to-end without an API key. Live mode (real Claude calls) is intentionally not exercised in the public deploy.

## 🎥 Demo

![Demo](./demo.gif)

## Live Flow

```
Scenario seeded in DB (inputs + fixtures + assertions, tag=seed-demo)
  → POST /scenarios/{id}/run (runScenarioAction) → runScenario()
    → EventCapture + SeededPRNG + FrozenClock constructed against the new run row
      → withCapture(MockLLMClient) wraps the LLM so every request/response is recorded
        → runAgentLoop iterates: complete → tool.call → SnapshotToolExecutor.execute → tool.result
          → llm.request / llm.response / tool.call / tool.result / runtime.* events captured in order
            → evaluateRun(pendingEvents, assertions) runs the 6-type assertion DSL pre-flush
              → emit('evaluation.result') for each assertion (PASS/FAIL with message)
                → detectRegression(current, prior) compares against immediate predecessor
                  → capture.flush(prisma) - atomic transaction: createMany(events) + run.update(replayHash, status, eval counts, regression)
                    → /runs/{id} renders RunHeader + EvaluationsList + Timeline
                      → Pick 2 runs on the scenario → /compare/{runA}/{runB}
                        → diffRuns(refsA, refsB) by contentHash → ComparePanes (sync-scrolled, sticky divergence marker)
                          → VerdictPill: identical · ✓ byte-deterministic / diverged @ #N / length-mismatch
```

The runner is byte-deterministic across two runs with the same `seed`. The seeded **Refund flow** demo proves it: baseline and replay-verification runs produce identical `replayHash` values; the broken-prompt run diverges on the first wrong tool call and three assertions flip from PASS to FAIL.

## ✨ Features

- **Eight typed event types** (Zod-discriminated): `llm.request`, `llm.response`, `tool.call`, `tool.result`, `runtime.random`, `runtime.time`, `branch.created`, `evaluation.result`
- **Canonical JSON + sha256** - recursive key sort, no whitespace, `Date → ISO`, `BigInt → string`, `NaN`/`Infinity` rejected. `contentHash` per event, `replayHash` per run
- **Snapshot replay** - a seeded PRNG (mulberry32), a frozen logical clock and a fixture-keyed tool executor make the same run produce a byte-identical `replayHash` across executions
- **Assertion DSL** - six assertion types: `tool_called`, `tool_not_called`, `response_contains`, `response_matches`, `event_count_equals`, `replay_hash_equals`. Stable per-assertion `id`s so regression detection can compare across runs
- **Regression detection** - overlap-only: an assertion that **passed in the prior run and now fails** is a regression. New assertions and removed assertions don't trigger it
- **Side-by-side compare** - `/compare/{runA}/{runB}` aligns events by sequence, classifies each pair as `match` / `diverge` / `onlyA` / `onlyB`, scrolls in lock-step, jumps to the first divergence
- **Inline run viewer** - `/runs/{id}` shows status + assertion pass-rate + regression chip + token totals, a card-stack timeline with expandable payloads and an Evaluations panel with per-assertion PASS/FAIL rows
- **Mock LLM by default** - `MockLLMClient` matches the last user message against canned `(substring | RegExp) → response` rules. The agent loop is identical for mock and live; just swap the client
- **Live Anthropic adapter** - `AnthropicLLMClient` wraps `@anthropic-ai/sdk` against Claude Haiku 4.5 by default
- **Seeded refund demo** - `npx prisma db seed` creates a 5-assertion scenario and three runs (baseline pass / replay-verification byte-identical / broken-prompt regression) so the UI is fully usable in seconds

## 🖼️ Screenshots

![Scenario detail with comparable runs](./screenshots/scenario-detail.png)
![Side-by-side compare with sticky divergence marker](./screenshots/compare-regression.png)
![Run viewer with evaluations + timeline](./screenshots/run-viewer.png)

## 🧠 Tech Stack

**App**

| Technology   | Version | Role                                                                |
| ------------ | ------- | ------------------------------------------------------------------- |
| Next.js      | 16.2.6  | App Router, server components, server actions                       |
| React        | 19.2    | UI framework (uses `useActionState`, async `params`/`searchParams`) |
| TypeScript   | 5       | Strict mode, `noEmit`, `target: ES2022` (BigInt literals)           |
| Tailwind CSS | 4       | `@theme inline` tokens in `app/globals.css`, postcss plugin variant |
| Zod          | 4       | Event-payload schemas, assertion DSL, server-action form parsing    |

**Persistence**

| Technology           | Role                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Prisma               | 7.8 - ESM client generated to `src/generated/prisma/`, schema datasource has no `url` (lives in `prisma.config.ts`) |
| `@prisma/adapter-pg` | Required runtime adapter - `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`                      |
| PostgreSQL           | 16 (Alpine) via `docker-compose.yml` (`arl-postgres` on port 5432)                                                  |

**Agent runtime**

| Component                  | Role                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EventCapture`             | Buffers typed events with monotonic `sequenceNumber`; computes `contentHash` per event and `replayHash` per run; atomic transactional flush         |
| `canonicalJSON` / `sha256` | Stable serialiser (recursive key sort, rejects `NaN`/`Infinity`, `Date → ISO`, `BigInt → string`) + `node:crypto` sha256                            |
| `SeededPRNG`               | mulberry32 - emits a `runtime.random` event on every draw                                                                                           |
| `FrozenClock`              | Logical-clock substitute for `Date.now()` - `advance(ms)` ticks the clock and emits `runtime.time`                                                  |
| `SnapshotToolExecutor`     | `fixtures[fixtureKey(toolName, input)]` lookup; throws `SnapshotMiss` on absent key                                                                 |
| `LLMClient` interface      | One method: `complete(LLMRequest) → Promise<LLMResponse>` with `stopReason: 'end_turn' \| 'tool_use' \| 'max_tokens' \| 'stop_sequence' \| 'error'` |
| `MockLLMClient`            | Scripted responses; matches last user message by `substring \| RegExp`                                                                              |
| `AnthropicLLMClient`       | Real Claude via `@anthropic-ai/sdk`, default model `claude-haiku-4-5`                                                                               |
| `withCapture(inner)`       | Higher-order wrapper that records `llm.request` / `llm.response` events around any `LLMClient`                                                      |
| `runAgentLoop`             | Anthropic-style tool-use loop with `MAX_ITERATIONS = 10` default; appends `TOOL_RESULT[<callId>]: <canonicalJSON>` user messages                    |
| `runScenario`              | Public entry point: builds the capture, runs the loop, runs `evaluateRun`, runs `detectRegression`, flushes atomically                              |

**Evaluations**

| Component                    | Role                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `AssertionSchema`            | Zod discriminated union over six assertion types                                                            |
| `evaluateRun(events, [a])`   | Runs each assertion against the pre-flush event stream; returns `{ assertionId, passed, message? }[]`       |
| `detectRegression`           | Overlap-only: regression iff `prior.passed === true && current.passed === false` for the same `assertionId` |
| `loadAssertionResultsForRun` | Reloads prior `evaluation.result` events from Postgres for the regression comparison                        |

**Tooling**

| Technology                      | Role                                                                      |
| ------------------------------- | ------------------------------------------------------------------------- |
| Vitest 4                        | Two-project config (`node` for `*.test.ts`, `jsdom` for `*.test.tsx`)     |
| `@testing-library/react`        | Component tests against jsdom                                             |
| `@vitejs/plugin-react`          | JSX/TSX transform for tests                                               |
| Husky                           | `pre-commit` (lint-staged) + `pre-push` (`npm run test && npm run build`) |
| lint-staged + Prettier + ESLint | Format + lint the staged set on every commit                              |
| Anthropic SDK                   | `@anthropic-ai/sdk ^0.97.0`                                               |
| `tsx`                           | Runs `prisma/seed.ts` for `npx prisma db seed`                            |

**Infrastructure**

| Technology        | Role                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------- |
| Docker            | App container (`Dockerfile`) + Postgres service (`docker-compose.yml`)                 |
| Google Cloud Run  | Production hosting (`europe-west2`, see [Cloud Run Deployment](#cloud-run-deployment)) |
| Artifact Registry | Container image storage                                                                |

## Architecture

```
agent-regression-lab/
├── app/
│   ├── page.tsx                          Redirects → /scenarios
│   ├── layout.tsx                        Root layout (Inter + Geist Mono, header nav)
│   ├── globals.css                       Tailwind 4 @theme inline tokens
│   ├── scenarios/
│   │   ├── page.tsx                      ScenarioList + NewScenarioForm
│   │   ├── actions.ts                    "use server" - createScenarioAction, runScenarioAction
│   │   └── [id]/page.tsx                 Scenario detail: inputs / fixtures / assertions / ComparableRunsShell
│   ├── runs/[id]/page.tsx                RunHeader + EvaluationsList + Timeline
│   └── compare/[runA]/[runB]/page.tsx    CompareHeader + ComparePanes (diffRuns by contentHash)
├── src/
│   ├── server/
│   │   ├── db/client.ts                  Lazy Prisma proxy + PrismaPg adapter
│   │   ├── events/
│   │   │   ├── types.ts                  Zod schemas for all 8 event types
│   │   │   ├── canonical.ts              canonicalJSON + sha256 (rejects NaN/Infinity)
│   │   │   └── capture.ts                EventCapture - buffer + contentHash + atomic flush
│   │   ├── runner/
│   │   │   ├── runner.ts                 runScenario - public entry point
│   │   │   ├── agent-loop.ts             Tool-use loop (Anthropic-style)
│   │   │   ├── prng.ts                   SeededPRNG (mulberry32)
│   │   │   ├── clock.ts                  FrozenClock (logical-clock substitute)
│   │   │   ├── tool-executor.ts          SnapshotToolExecutor + fixtureKey()
│   │   │   └── errors.ts                 LiveModeNotImplemented, MaxIterationsExceeded
│   │   ├── llm/
│   │   │   ├── types.ts                  LLMClient / LLMRequest / LLMResponse interfaces
│   │   │   ├── mock.ts                   MockLLMClient - canned responses
│   │   │   ├── anthropic.ts              AnthropicLLMClient - claude-haiku-4-5
│   │   │   ├── capture.ts                withCapture(inner) - records llm.request/response
│   │   │   └── factory.ts                makeLLMClient({ mode: 'mock' | 'anthropic' })
│   │   └── evals/
│   │       ├── types.ts                  AssertionSchema (Zod discriminated union, 6 types)
│   │       ├── engine.ts                 evaluateRun(events, assertions)
│   │       ├── regression.ts             detectRegression(current, prior)
│   │       └── load.ts                   loadAssertionResultsForRun(prisma, runId)
│   ├── components/
│   │   ├── scenario/                     ScenarioList, NewScenarioForm, RunButton, ComparableRunsShell, RunsList
│   │   ├── run/                          RunHeader, EvaluationsList, EvalRow, Timeline, TimelineEvent, ExpandablePayload
│   │   ├── compare/                      CompareHeader, ComparePanes, DiffCell, DivergenceMarker, SyncScroll, JumpToDivergenceButton, VerdictPill
│   │   └── ui/                           Button, Card, Pill, CopyButton, EmptyState, ErrorBanner
│   ├── lib/
│   │   ├── diff.ts                       diffRuns(a, b) - pair-by-pair contentHash diff
│   │   ├── format.ts                     shortHash, formatDuration, formatTokens, formatRelativeTime
│   │   ├── validation.ts                 parseTags, parseInputsJSON, parseFixturesJSON
│   │   └── assertion-validation.ts       parseAssertionsJSON
│   └── types/                            run.ts (RunStatus), compare.ts (EventRef, DiffPair, Verdict)
├── prisma/
│   ├── schema.prisma                     Scenario / Run / Event + RunMode/RunStatus enums
│   ├── migrations/                       init_event_model + eval_columns_on_run
│   ├── seed.ts                           Orchestrates the 3-run refund demo
│   └── seed/refund-data.ts               GOOD_INPUTS / BAD_INPUTS / REFUND_FIXTURES / ASSERTIONS
├── prisma.config.ts                      datasource.url + migrations.seed (Prisma 7 location)
├── docker-compose.yml                    Postgres 16 alpine (arl/arl/arl on :5432)
├── Dockerfile                            Three-stage build: deps → builder → runner (node server.js)
├── vitest.config.ts                      Two projects: node (.test.ts) + jsdom (.test.tsx)
└── package.json                          Next 16, React 19, TS 5, Prisma 7, Zod 4, Vitest 4
```

**Request pipeline (view scenarios):**

```
Browser → GET /scenarios
  → app/scenarios/page.tsx (server component)
    → prisma.scenario.findMany({ include: { runs (last), _count: runs } })
    → <ScenarioList rows={...} /> + <NewScenarioForm /> (client, useActionState)
```

**Request pipeline (run a scenario):**

```
RunButton form POSTs to runScenarioAction
  → "use server"
    → runScenario({ scenarioId })
      → prisma.scenario.findUniqueOrThrow → reads inputs, fixtures, assertions
      → prisma.run.create({ status: RUNNING, mode: SNAPSHOT, model: 'mock' })
        → new EventCapture(run.id) + new FrozenClock + new SeededPRNG(seed ?? hashSeed(run.id))
          → withCapture(MockLLMClient(inputs.cannedResponses))
            → runAgentLoop({ llm, executor, capture, initialMessages, maxIterations: 10 })
              ├── llm.request emitted
              ├── llm.response emitted
              ├── tool.call emitted (per toolCall)
              ├── executor.execute(toolName, input) → fixtures[fixtureKey(...)]
              ├── tool.result emitted
              └── messages.push({ role: 'user', content: 'TOOL_RESULT[<callId>]: <canonicalJSON>' })
          → evaluateRun(capture.pendingEvents, assertions)
          → emit('evaluation.result') for each result
          → detectRegression(current, loadAssertionResultsForRun(prior))
          → capture.flush(prisma)  - TRANSACTION:
              ├── createMany(events) with payload + contentHash + sequenceNumber + logicalClock
              └── run.update({ replayHash, status: COMPLETE, finishedAt })
          → run.update({ totalTokensIn/Out, durationMs, passedAssertions, totalAssertions, regression, regressedAssertionIds })
    → revalidatePath(/scenarios/{id}) → redirect(/runs/{newRunId})
```

**Request pipeline (compare two runs):**

```
ComparableRunsShell (client) → router.push(/compare/{runA}/{runB})
  → app/compare/[runA]/[runB]/page.tsx (server component)
    → Promise.all([ prisma.run.findUnique(A), prisma.run.findUnique(B) ])
    → Guard: same scenario? both COMPLETE/FAILED? else redirect(?error=...)
    → Promise.all([ prisma.event.findMany(A, asc), prisma.event.findMany(B, asc) ])
    → diffRuns(refsA, refsB) - pair-by-pair contentHash comparison
        → kind: 'match' | 'diverge' | 'onlyA' | 'onlyB'
        → firstDivergence: index of first non-match
        → verdict: 'identical' | 'diverged' | 'length-mismatch'
    → <CompareHeader> (verdict pill, sync-scroll toggle, jump-to-divergence, per-run stats, regression line)
    → <ComparePanes> (two sync-scrolled lists, sticky divergence marker, colored DiffCells)
```

## Setup

### Prerequisites

- Node.js 22+
- Docker (for the local Postgres instance via `docker-compose.yml`)
- Git
- An Anthropic API key (only required for `mode: 'anthropic'`; the seeded demo uses `MockLLMClient`)

### 1. Clone and install

```bash
git clone https://github.com/Cash-Codes/Agent-Regression-Lab.git
cd Agent-Regression-Lab
npm install
```

`npm install` runs `prisma generate` via Husky's `prepare` script; the generated ESM client lands at `src/generated/prisma/` (gitignored).

### 2. Configure environment

```bash
cp .env-example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://arl:arl@localhost:5432/arl?schema=public"
# Optional. If unset, the demo uses MockLLMClient.
# ANTHROPIC_API_KEY=sk-ant-...
```

See [Environment Variables](#environment-variables) for the full reference.

### 3. Start Postgres + apply migrations + seed

```bash
docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed
```

The seed (`prisma/seed.ts`) is idempotent - it deletes prior scenarios tagged `seed-demo` and recreates the **Refund flow** scenario plus three runs.

### 4. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000` (auto-redirects to `/scenarios`). You should see the seeded **Refund flow** scenario with three runs.

### 5. Try the demo flow

1. Open the **Refund flow** scenario.
2. Tick **baseline** + **replay verification** → click **Compare 2 runs**. The `VerdictPill` reads `identical · ✓ byte-deterministic` - proof of byte-deterministic replay across two independent runs with the same `seed`.
3. Back to the scenario, tick **replay verification** + **broken prompt** → Compare. The verdict flips to `diverged @ #N`; the sticky `DivergenceMarker` shows the first non-matching pair and the header's regression line lists `B:calls-eligibility, B:no-unilateral-refund, B:asks-confirmation`.
4. Open the **broken prompt** run directly. The `EvaluationsList` shows three FAIL rows with the engine's exact failure messages; the timeline includes red `evaluation.result` pills inline with the events.

## Docker (local app container)

The `Dockerfile` is a three-stage build (`deps → builder → runner`) that produces a minimal standalone image for Cloud Run cold-starts:

```bash
# Build
docker build -t agent-regression-lab:local .

# Run against the host Postgres (Linux: --network host; macOS/Windows: use host.docker.internal in DATABASE_URL)
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://arl:arl@host.docker.internal:5432/arl?schema=public" \
  agent-regression-lab:local
```

Open `http://localhost:3000`. The container does **not** auto-run migrations or seeds - run those against the host DB before starting the container.

## Cloud Run Deployment

### 1. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project agent-regression-lab
```

### 2. Enable APIs + create the Artifact Registry repo (once)

```bash
export REGION=europe-west2
export PROJECT_ID=agent-regression-lab

gcloud services enable run.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories create agent-regression-lab \
  --repository-format=docker \
  --location=${REGION}

gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 3. Provision Neon Postgres (once)

1. Create a project at https://neon.tech
2. Copy the `DATABASE_URL` from the dashboard (with `?sslmode=require`)
3. From your laptop: run the schema migrations and seed the demo scenario

```bash
DATABASE_URL="postgresql://<neon-url>?sslmode=require" npx prisma migrate deploy
DATABASE_URL="postgresql://<neon-url>?sslmode=require" npx prisma db seed
```

### 4. Build and push the image

```bash
docker build \
  --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-regression-lab/app:latest \
  .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-regression-lab/app:latest
```

### 5. Deploy

```bash
gcloud run deploy agent-regression-lab \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-regression-lab/app:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 60s \
  --set-env-vars DATABASE_URL="postgresql://<neon-url>?sslmode=require"
```

The deploy prints a service URL. The public deploy intentionally does **not** set `ANTHROPIC_API_KEY` — the runner falls back to `MockLLMClient` and the header shows a `demo · mock LLM` pill.

### 6. Verify

```bash
SERVICE_URL=$(gcloud run services describe agent-regression-lab --region ${REGION} --format='value(status.url)')
curl -s "$SERVICE_URL/api/health" | jq .
curl -s -o /dev/null -w "/scenarios → %{http_code}\n" "$SERVICE_URL/scenarios"
```

## Testing

```bash
# All tests (both projects)
npm test

# Watch mode
npm run test:watch

# Lint
npm run lint

# Format check
npm run format:check
```

Vitest runs two projects (`vitest.config.ts`):

- **`node`** - `src/**/*.test.ts`, `app/**/*.test.ts`, `prisma/seed/**/*.test.ts` - runs in Node, used for the server runtime (events, runner, evals, LLM clients, server actions, seed data validation)
- **`jsdom`** - `src/**/*.test.tsx`, `app/**/*.test.tsx` - runs in jsdom with `@testing-library/react` for component tests

A Husky `pre-commit` hook runs `lint-staged` (eslint + prettier on the staged set). `pre-push` runs `npm run test && npm run build` - the full test suite plus a production build.

## Demo Mode

The seed (`prisma/seed.ts`) wipes prior scenarios tagged `seed-demo` and creates **Refund flow** with three runs:

| Run                 | Seed | Inputs        | Expected                                                                                   |
| ------------------- | ---- | ------------- | ------------------------------------------------------------------------------------------ |
| baseline            | 42   | `GOOD_INPUTS` | 5/5 assertions pass; `replayHash` is the determinism reference                             |
| replay verification | 42   | `GOOD_INPUTS` | byte-identical to baseline; `Compare` reads `identical · ✓ byte-deterministic`             |
| broken prompt       | 99   | `BAD_INPUTS`  | 2/5 pass, 3 regressions (`calls-eligibility`, `no-unilateral-refund`, `asks-confirmation`) |

The five assertions:

| `id`                   | Type                 | Check                                      |
| ---------------------- | -------------------- | ------------------------------------------ |
| `calls-lookup`         | `tool_called`        | agent looks up the order before deciding   |
| `calls-eligibility`    | `tool_called`        | agent checks eligibility before refunding  |
| `no-unilateral-refund` | `tool_not_called`    | agent must NOT refund without confirmation |
| `asks-confirmation`    | `response_contains`  | response contains `'confirm'`              |
| `two-tool-calls`       | `event_count_equals` | exactly 2 `tool.call` events (good path)   |

To reset between demos:

```bash
npx prisma db seed
```

## Environment Variables

| Variable            | Required                   | Default       | Description                                                                                        |
| ------------------- | -------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | **Yes**                    | -             | Postgres connection string. Read by `prisma.config.ts` and by `src/server/db/client.ts` at runtime |
| `ANTHROPIC_API_KEY` | For `mode: anthropic` only | -             | Anthropic API key for `AnthropicLLMClient`. If unset, scenarios run with `MockLLMClient`           |
| `NODE_ENV`          | No                         | `development` | Runtime environment. Prisma client is module-scoped (not globalThis-cached) in production          |
| `PORT`              | No                         | `3000`        | Server listen port (Cloud Run sets this)                                                           |
| `HOSTNAME`          | No                         | `0.0.0.0`     | Bind address (Docker/Cloud Run)                                                                    |

## Troubleshooting

**`DATABASE_URL is not set`**
`src/server/db/client.ts` throws this from `buildPrismaClient()` if the env var is missing. Confirm `.env` exists at the repo root and is loaded - `dotenv/config` is imported at the top of `prisma.config.ts` and `prisma/seed.ts`, so `npx prisma` commands work, but a bare `node` invocation needs the env loaded separately.

**`To seed your database, add a seed property to the migrations section in your Prisma config file.`**
Prisma 7 moved the seed hook from `package.json` (`prisma.seed`) to `prisma.config.ts` (`migrations.seed`). Confirm `prisma.config.ts` has `migrations: { seed: 'tsx prisma/seed.ts' }`.

**`Prisma Client could not be generated. The required engine type "library" / adapter is not configured.`**
Prisma 7 ESM client requires the runtime adapter. Confirm `src/server/db/client.ts` constructs the client as `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })` (not `new PrismaClient({ datasourceUrl: ... })`).

**`Error: connect ECONNREFUSED 127.0.0.1:5432`**
The local Postgres container isn't running or another container is holding port 5432. Check `docker ps`; if another service holds the port, either stop it or change the port mapping in `docker-compose.yml` and update `DATABASE_URL` accordingly.

**`MockResponseMissing` thrown mid-run**
`MockLLMClient` matched no canned response to the last user message. The runner emits `TOOL_RESULT[<callId>]: <canonicalJSON>` as the user content for tool results - make sure your `cannedResponses` use `'TOOL_RESULT[c-1]'` (callId-specific) rather than `'TOOL_RESULT['` (which matches the first call ambiguously).

**`SnapshotMiss: No fixture for <toolName>:<sha256>`**
The agent called a tool with arguments not present in `scenario.fixtures`. The key is `${toolName}:${sha256(canonicalJSON(input))}` - recompute it via `fixtureKey(toolName, input)` from `src/server/runner/tool-executor.ts` and add the entry.

**`Compare` shows `length-mismatch` for runs you expected to be identical**
The verdict is `length-mismatch` when one run's event stream is a strict prefix of the other (every diverging pair is `onlyA` or `onlyB`). Most often: a regression in the loop produced a different `evaluation.result` count or `runtime.random`/`runtime.time` drifted. Compare `replayHash` values directly; if they differ, the runs are not byte-identical.

**`Cannot find module '@/...' / '@server/...' / '@actions/...'`**
Path aliases are declared in **both** `tsconfig.json` (`compilerOptions.paths`) and `vitest.config.ts` (`resolve.alias`). Editing one without the other breaks either the type-check or the test run.

---

Good luck and feel free to reach out if you need any clarification or would like to contribute further. Always happy to help. Thanks!

---

**Document Version:** 1.0
**Last Updated:** June, 2026
**Maintainer:** Cashley <cashley.dps@gmail.com>
