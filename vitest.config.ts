import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import 'dotenv/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@server': resolve(__dirname, 'src/server'),
      '@actions': resolve(__dirname, 'app/scenarios'),
    },
  },
  test: {
    passWithNoTests: true,
    pool: 'threads',
    testTimeout: 10_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/**/*.test.ts',
            'app/**/*.test.ts',
            'prisma/seed/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.tsx', 'app/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
