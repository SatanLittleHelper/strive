import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { tap, catchError, of, finalize, map, firstValueFrom, timeout } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshResponse,
} from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import { getTokenExpirationSeconds } from '@/shared/lib/utils';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';
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
  readonly isRefreshingTokens = signal(false);

  initFromStorage(): void {
    const accessToken = this.tokenStorage.getAccessToken();
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.isAuthenticated.set(!!accessToken && !!refreshToken);
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

  clearError(): void {
    this.error.set(null);
  }

  async refreshTokenSync(): Promise<boolean> {
    if (this.isRefreshingTokens()) {
      return false;
    }

    this.isRefreshingTokens.set(true);

    try {
      const refreshToken = this.tokenStorage.getRefreshToken();

      if (!refreshToken) {
        this.logout();
        return false;
      }

      const response: RefreshResponse = await firstValueFrom(
        this.authApi.refresh$(refreshToken).pipe(timeout(10000)),
      );

      this.tokenStorage.setTokens(response.access_token, refreshToken);
      this.isAuthenticated.set(true);

      return true;
    } catch {
      this.logout();
      return false;
    } finally {
      this.isRefreshingTokens.set(false);
    }
  }

  async isAuthenticatedAndValid(): Promise<boolean> {
    const accessToken = this.tokenStorage.getAccessToken();
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!accessToken && !refreshToken) {
      return false;
    }

    if (accessToken && !this.isTokenExpired(accessToken)) {
      return true;
    }

    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      this.refreshTokensInBackground();
      return true;
    }

    this.logout();
    return false;
  }

  private refreshTokensInBackground(): void {
    if (this.isRefreshingTokens()) {
      return;
    }

    this.refreshTokenSync().catch(() => {});
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

    const expirationSeconds = getTokenExpirationSeconds(token);

    if (expirationSeconds === null) {
      return true;
    }

    return expirationSeconds <= 0;
  }
}
