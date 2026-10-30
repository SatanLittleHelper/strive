import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { useContainer } from 'class-validator';
import { AppModule } from './app/app.module.js';
import { configureApp } from './app/app.setup.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  configureApp(app);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const config = app.get(ConfigService);

  await app.listen(config.getOrThrow<number>('PORT'), config.getOrThrow<string>('HOST'));
}

bootstrap().catch((error: unknown) => {
  console.error('Не удалось запустить API', error);
  process.exitCode = 1;
});
