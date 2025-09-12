import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { tap, catchError, of, finalize, map } from 'rxjs';
import type { ApiError } from '@/shared/lib/types';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';
import { AuthApiService } from './auth-api.service';
import type { LoginRequest, RegisterRequest, LoginResponse } from '../models/auth.types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isAuthenticated = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  initFromStorage(): void {
    const accessToken = this.tokenStorage.getAccessToken();
    this.isAuthenticated.set(!!accessToken);
  }

  login$(body: LoginRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authApi.login$(body).pipe(
      tap((response: LoginResponse) => {
        this.tokenStorage.setTokens(response.access_token, response.refresh_token);
        this.isAuthenticated.set(true);

        const targetUrl = sessionStorage.getItem('return_url') || '/dashboard';
        sessionStorage.removeItem('return_url');
        void this.router.navigate([targetUrl]);
      }),
      map(() => void 0),
      catchError((error: ApiError) => {
        this.error.set(error.message);
        return of(undefined);
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  register$(body: RegisterRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authApi.register$(body).pipe(
      tap(() => {
        void this.router.navigate(['/login']);
      }),
      catchError((error: ApiError) => {
        this.error.set(error.message);
        return of(undefined);
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this.isAuthenticated.set(false);
    void this.router.navigate(['/login']);
  }
}
