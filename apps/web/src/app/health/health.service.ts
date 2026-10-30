import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { HealthResponse } from '@strive/api-interfaces';
import { catchError, map, of } from 'rxjs';
import { API_URL_PREFIX } from '../api';

@Service()
export class HealthService {
  private readonly http = inject(HttpClient);

  // тело ответа уже разобрано unwrapResponseInterceptor
  readonly status = toSignal(
    this.http.get<HealthResponse>(`${API_URL_PREFIX}/health`).pipe(
      map((response) => (response.status === 'ok' ? 'API работает' : 'API недоступен')),
      catchError(() => of('API недоступен')),
    ),
    { initialValue: 'Проверка API…' },
  );
}
