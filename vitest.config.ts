import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import 'dotenv/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    pool: 'threads',
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@server': resolve(__dirname, 'src/server'),
    },
  },
});
