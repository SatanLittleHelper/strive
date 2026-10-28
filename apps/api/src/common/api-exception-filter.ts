import {
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Response } from 'express';
import type { ApiResponse } from './api.types.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error(exception, 'Ошибка запроса');

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Внутренняя ошибка сервера';
    const body: ApiResponse<null> = { success: false, message, data: null, details: null };

    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
