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
import type { ApiResponse } from '@strive/api-interfaces';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Внутренняя ошибка сервера';

    // предсказуемые ошибки клиента (400, 404) не должны засорять error-лог стек-трейсами
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception, 'Ошибка запроса');
    } else {
      this.logger.warn({ status }, message);
    }

    const body: ApiResponse<null> = { success: false, message, data: null, details: null };

    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
