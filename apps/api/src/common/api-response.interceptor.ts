import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '@strive/api-interfaces';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message: null,
        data: data ?? null,
        details: null,
      })),
    );
  }
}
