import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { API_GLOBAL_PREFIX } from '@strive/api-interfaces';
import { VALIDATION_PIPE_OPTIONS } from '../common/validation-pipe.constants.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
}
