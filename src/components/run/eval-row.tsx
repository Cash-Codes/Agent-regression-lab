export function EvalRow({
  assertionId,
  description,
  passed,
  message,
}: {
  assertionId: string;
  description?: string;
  passed: boolean;
  message?: string;
}) {
  const pillClass = passed
    ? 'bg-pill-eval-pass-soft text-pill-eval-pass'
    : 'bg-pill-eval-fail-soft text-pill-eval-fail';
  return (
    <div className="border-border flex items-start gap-3 border-b px-3 py-2 last:border-b-0">
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${pillClass}`}
      >
        {passed ? 'PASS' : 'FAIL'}
      </span>
      <div className="min-w-0">
        <div className="text-foreground text-sm font-medium">{assertionId}</div>
        {description ? (
          <div className="text-muted text-xs">{description}</div>
        ) : null}
        {!passed && message ? (
          <div className="text-pill-eval-fail mt-1 font-mono text-xs">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
