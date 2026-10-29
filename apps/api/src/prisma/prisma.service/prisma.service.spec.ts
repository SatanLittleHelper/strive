import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { getDatabaseUrl } from '../../test-support/index.js';
import { PrismaService } from './prisma.service.js';

const UNREACHABLE_DATABASE_URL = 'postgresql://strive:strive@127.0.0.1:1/strive';

function createService(databaseUrl: string): PrismaService {
  const config = { getOrThrow: () => databaseUrl } as unknown as ConfigService;

  return new PrismaService(config);
}

describe('PrismaService', () => {
  it('падает на старте, если БД недоступна', async () => {
    const service = createService(UNREACHABLE_DATABASE_URL);

    await expect(service.onModuleInit()).rejects.toThrow();

    await service.onModuleDestroy();
  });

  it('стартует, когда БД доступна', async () => {
    const service = createService(getDatabaseUrl());

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    await service.onModuleDestroy();
  });
});
