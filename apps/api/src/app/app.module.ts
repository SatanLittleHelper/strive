import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import Joi from 'joi';
import { AppController } from './app.controller.js';
import { ApiExceptionFilter } from '../common/api-exception-filter.js';
import { ApiResponseInterceptor } from '../common/api-response.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        HOST: Joi.string().default('127.0.0.1'),
        LOG_LEVEL: Joi.string()
          .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
          .default('info'),
        LOG_PRETTY: Joi.string().valid('true', 'false').default('false'),
      }),
    }),
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
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
  ],
})
export class AppModule {}
