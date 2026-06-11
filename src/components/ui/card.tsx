import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`border-border bg-background rounded-lg border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
