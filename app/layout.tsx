import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Agent Regression Lab',
  description:
    'Deterministic testing and regression infrastructure for LLM agent systems — replay runs, compare across prompts and models, detect behavioral drift.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <header className="border-border bg-background border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <Link
              href="/scenarios"
              className="text-sm font-semibold tracking-tight"
            >
              Agent Regression Lab
            </Link>
            <nav className="text-muted text-sm">
              <Link href="/scenarios" className="hover:text-foreground">
                Scenarios
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
