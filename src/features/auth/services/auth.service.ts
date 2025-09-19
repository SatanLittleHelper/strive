import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { tap, catchError, of, finalize, map, firstValueFrom, timeout } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest } from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isAuthenticated = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private lastAuthCheck = 0;
  private readonly AUTH_CACHE_DURATION = 5 * 60 * 1000; // Фиксированное время кэша - 5 минут

  login$(body: LoginRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authApi.login$(body).pipe(
      tap(() => {
        this.setAuthenticatedState();

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
    const handleLogout = (): void => {
      this.isAuthenticated.set(false);
      this.lastAuthCheck = 0;
      void this.router.navigate(['/login']);
    };
    this.authApi
      .logout$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          handleLogout();
        },
        error: () => {
          handleLogout();
        },
      });
  }

  clearError(): void {
    this.error.set(null);
  }

  private setAuthenticatedState(): void {
    this.isAuthenticated.set(true);
    this.lastAuthCheck = Date.now();
  }

  async isAuthenticatedAndValid(): Promise<boolean> {
    const now = Date.now();

    if (this.isAuthenticated() && now - this.lastAuthCheck < this.AUTH_CACHE_DURATION) {
      return true;
    }

    // Если кэш устарел, проверяем сервер
    try {
      await firstValueFrom(this.authApi.checkAuth$().pipe(timeout(5000)));
      this.setAuthenticatedState();
      return true;
    } catch {
      this.isAuthenticated.set(false);
      this.lastAuthCheck = 0;
      return false;
    }
  }
}
