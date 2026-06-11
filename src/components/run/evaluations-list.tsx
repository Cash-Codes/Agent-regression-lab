import { Card } from '../ui/card';
import { EvalRow } from './eval-row';
import type { Assertion } from '../../server/evals/types';

export interface EvaluationItem {
  assertionId: string;
  passed: boolean;
  message?: string;
}

export function EvaluationsList({
  results,
  assertions,
}: {
  results: EvaluationItem[];
  assertions: Assertion[];
}) {
  if (results.length === 0) return null;
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const descriptionById = new Map<string, string | undefined>(
    assertions.map((a) => [a.id, a.description]),
  );
  return (
    <Card>
      <div className="border-border flex items-center justify-between border-b px-3 py-2 text-xs">
        <span className="text-foreground font-semibold">Evaluations</span>
        <span className="text-muted">
          {passed}/{total} passed
        </span>
      </div>
      {results.map((r) => (
        <EvalRow
          key={r.assertionId}
          assertionId={r.assertionId}
          description={descriptionById.get(r.assertionId)}
          passed={r.passed}
          message={r.message}
        />
      ))}
    </Card>
  );
}
