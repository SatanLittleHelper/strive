import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { API_GLOBAL_PREFIX } from '@strive/api-interfaces';
import { Logger } from 'nestjs-pino';
import { useContainer } from 'class-validator';
import { AppModule } from './app/app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const config = app.get(ConfigService);

  await app.listen(config.getOrThrow<number>('PORT'), config.getOrThrow<string>('HOST'));
}

bootstrap().catch((error: unknown) => {
  console.error('Не удалось запустить API', error);
  process.exitCode = 1;
});
