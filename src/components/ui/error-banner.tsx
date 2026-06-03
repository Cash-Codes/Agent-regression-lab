import type { ReactNode } from 'react';

export function ErrorBanner({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="border-pill-eval-fail/30 bg-pill-eval-fail-soft rounded-md border px-4 py-3 text-sm"
    >
      <div className="text-pill-eval-fail font-semibold">{title}</div>
      {children ? (
        <div className="text-pill-eval-fail mt-1">{children}</div>
      ) : null}
    </div>
  );
}
