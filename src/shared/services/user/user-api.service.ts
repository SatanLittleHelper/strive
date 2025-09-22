import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { env } from '@/environments/env';
import type { User } from '@/shared/lib/types';
import { handleApiError } from '@/shared/lib/utils';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${env.apiHost}/v1/auth/`;

  getMe$(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}me`).pipe(catchError(handleApiError));
  }
}
