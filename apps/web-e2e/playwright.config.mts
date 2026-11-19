import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const isCI = Boolean(process.env['CI']);
const startupTimeout = 120_000;
// эталоны визуальных тестов сняты локально в Chromium: в CI (Linux) и в других движках шрифты сглаживаются иначе
const visualSpecs = /\.visual\.fast\.spec\.ts$/;
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: './src',
  testIgnore: isCI ? visualSpecs : undefined,
  snapshotPathTemplate: `${workspaceRoot}/docs/workout-feedback/reference/{arg}{ext}`,
  // Допуск 1% учитывает небольшие различия сглаживания шрифтов и скруглений.
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 } },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `${workspaceRoot}/tmp/playwright/report` }],
  ],
  outputDir: '../../tmp/playwright/test-results',
  use: { baseURL: 'http://127.0.0.1:4200', trace: 'on-first-retry' },
  webServer: [
    {
      command: 'npx nx run api:build && node dist/apps/api/main.js',
      url: 'http://127.0.0.1:3000/api/health',
      timeout: startupTimeout,
      cwd: workspaceRoot,
      reuseExistingServer: false,
    },
    {
      command: 'npm run start:web',
      url: 'http://127.0.0.1:4200',
      timeout: startupTimeout,
      cwd: workspaceRoot,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@touch/ },
    { name: 'chromium-touch', use: { ...devices['Pixel 7'] }, grep: /@touch/ },
    // firefox и webkit запускаются только локально, чтобы CI не ставил лишние браузеры
    ...(isCI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            grepInvert: /@touch/,
            testIgnore: visualSpecs,
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            grepInvert: /@touch/,
            testIgnore: visualSpecs,
          },
        ]),
  ],
});
