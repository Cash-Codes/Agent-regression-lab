import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-soft flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted mt-1 text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
