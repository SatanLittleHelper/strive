import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const HOOK_TIMEOUT_MS = 2 * 60 * 1000;

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    globalSetup: ['./src/test-support/global-setup.ts'],
    fileParallelism: false,
    hookTimeout: HOOK_TIMEOUT_MS,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/generated/**', 'src/test-support/**'],
    },
  },
});
