import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { afterEach, describe, expect, it } from 'vitest';
import { ApiExceptionFilter } from '../common/api-exception-filter.js';
import { ApiResponseInterceptor } from '../common/api-response.interceptor.js';
import { PrismaService } from '../prisma/index.js';
import { HealthController } from './health.controller.js';

const SERVICE_UNAVAILABLE = 503;

describe('HealthController', () => {
  const state: { app?: INestApplication } = {};

  afterEach(async () => {
    await state.app?.close();
  });

  it('отвечает 503 в едином формате, когда БД недоступна', async () => {
    // заглушка проверяет сопоставление отказа БД с ответом 503 в едином формате;
    // сам успешный ответ с реальной БД проверяет app.module.spec.ts
    const unavailablePrisma = {
      $runCommandRaw: () => Promise.reject(new Error('connection refused')),
      $queryRawUnsafe: () => Promise.reject(new Error('connection refused')),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule, LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: unavailablePrisma },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
      ],
    }).compile();
    state.app = moduleRef.createNestApplication();
    await state.app.listen(0, '127.0.0.1');

    const response = await fetch(`${await state.app.getUrl()}/health`);

    expect(response.status).toBe(SERVICE_UNAVAILABLE);
    expect(await response.json()).toMatchObject({ success: false, data: null });
  });
});
