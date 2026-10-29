import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ApiResponse, HealthResponse } from '@strive/api-interfaces';
import { catchError, map, of } from 'rxjs';

@Service()
export class HealthService {
  private readonly http = inject(HttpClient);

  readonly status = toSignal(
    this.http.get<ApiResponse<HealthResponse>>('/api/health').pipe(
      map((response) =>
        response.success && response.data?.status === 'ok' ? 'API работает' : 'API недоступен',
      ),
      catchError(() => of('API недоступен')),
    ),
    { initialValue: 'Проверка API…' },
  );
}
