import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ApiExceptionFilter } from '../common/api-exception-filter.js';
import { ApiResponseInterceptor } from '../common/api-response.interceptor.js';
import { envValidationSchema } from '../config/env.validation/index.js';
import { HealthModule } from '../health/index.js';
import { PrismaModule } from '../prisma/index.js';
import { SessionsModule } from '../sessions/index.js';
import { WorkoutsModule } from '../workouts/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'] ?? 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        ...(process.env['LOG_PRETTY'] === 'true'
          ? {
              transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } },
            }
          : {}),
      },
    }),
    PrismaModule,
    HealthModule,
    WorkoutsModule,
    SessionsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
  ],
})
export class AppModule {}
