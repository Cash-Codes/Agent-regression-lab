import type { ReactNode } from 'react';

export type PillVariant =
  | 'llm.request'
  | 'llm.response'
  | 'tool.call'
  | 'tool.result'
  | 'runtime.random'
  | 'runtime.time'
  | 'branch.created'
  | 'evaluation.result'
  | 'status-complete'
  | 'status-failed'
  | 'status-running'
  | 'status-pending';

const VARIANT_CLASSES: Record<PillVariant, string> = {
  'llm.request': 'bg-pill-llm-soft text-pill-llm',
  'llm.response': 'bg-pill-llm-soft text-pill-llm',
  'tool.call': 'bg-pill-tool-soft text-pill-tool',
  'tool.result': 'bg-pill-tool-soft text-pill-tool',
  'runtime.random': 'bg-pill-runtime-soft text-pill-runtime',
  'runtime.time': 'bg-pill-runtime-soft text-pill-runtime',
  'branch.created': 'bg-pill-runtime-soft text-pill-runtime',
  'evaluation.result': 'bg-pill-eval-pass-soft text-pill-eval-pass',
  'status-complete': 'bg-pill-eval-pass-soft text-pill-eval-pass',
  'status-failed': 'bg-pill-eval-fail-soft text-pill-eval-fail',
  'status-running': 'bg-pill-llm-soft text-pill-llm',
  'status-pending': 'bg-soft text-muted',
};

export function Pill({
  variant,
  children,
}: {
  variant: PillVariant;
  children: ReactNode;
}) {
  return (
    <span
      data-variant={variant}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
