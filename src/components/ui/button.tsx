import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-accent/40',
  secondary:
    'border border-border bg-background text-foreground hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/20',
  ghost:
    'text-foreground hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/10',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
