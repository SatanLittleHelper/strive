import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { env } from '@/environments/env';
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
} from '@/features/auth';
import { handleApiError } from '@/shared/lib/utils';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${env.apiHost}/v1/auth/`;

  login$(body: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}login`, body)
      .pipe(catchError(handleApiError));
  }

  register$(body: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}register`, body).pipe(catchError(handleApiError));
  }

  refresh$(): Observable<RefreshResponse> {
    return this.http
      .post<RefreshResponse>(`${this.baseUrl}refresh`, {})
      .pipe(catchError(handleApiError));
  }

  logout$(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}logout`, {}).pipe(catchError(handleApiError));
  }

  checkAuth$(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}me`).pipe(catchError(handleApiError));
  }
}
