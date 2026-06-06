import type { PrismaClient } from '../../generated/prisma/client';
import type { AssertionResult } from './types';

export async function loadAssertionResultsForRun(
  prisma: PrismaClient,
  runId: string,
): Promise<AssertionResult[]> {
  const rows = await prisma.event.findMany({
    where: { runId, type: 'evaluation.result' },
    orderBy: { sequenceNumber: 'asc' },
    select: { payload: true },
  });
  return rows.map((r) => {
    const p = r.payload as {
      assertionId: string;
      passed: boolean;
      message?: string;
    };
    return {
      assertionId: p.assertionId,
      passed: p.passed,
      message: p.message,
    };
  });
}
