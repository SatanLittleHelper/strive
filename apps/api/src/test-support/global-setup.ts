import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';
import './provided-context.types.js';

const POSTGRES_IMAGE = 'postgres:17-alpine';
const MIGRATE_TIMEOUT_MS = 60 * 1000;
const workspaceRoot = fileURLToPath(new URL('../../../../', import.meta.url));

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const databaseUrl = container.getConnectionUri();

  execFileSync('npx', ['prisma', 'migrate', 'deploy', '--config', 'apps/api/prisma.config.ts'], {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
    timeout: MIGRATE_TIMEOUT_MS,
  });

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await container.stop();
  };
}
