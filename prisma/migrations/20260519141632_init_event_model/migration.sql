-- CreateEnum
CREATE TYPE "RunMode" AS ENUM ('SNAPSHOT', 'LIVE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inputs" JSONB NOT NULL,
    "fixtures" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assertions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "label" TEXT,
    "promptVersion" TEXT,
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "modelConfig" JSONB,
    "mode" "RunMode" NOT NULL DEFAULT 'SNAPSHOT',
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "totalTokensIn" INTEGER,
    "totalTokensOut" INTEGER,
    "totalCostUsd" DECIMAL(10,6),
    "replayHash" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "parentEventId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "logicalClock" INTEGER NOT NULL,
    "wallTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scenario_createdAt_idx" ON "Scenario"("createdAt");

-- CreateIndex
CREATE INDEX "Run_scenarioId_createdAt_idx" ON "Run"("scenarioId", "createdAt");

-- CreateIndex
CREATE INDEX "Run_replayHash_idx" ON "Run"("replayHash");

-- CreateIndex
CREATE INDEX "Event_runId_type_idx" ON "Event"("runId", "type");

-- CreateIndex
CREATE INDEX "Event_contentHash_idx" ON "Event"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Event_runId_sequenceNumber_key" ON "Event"("runId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
