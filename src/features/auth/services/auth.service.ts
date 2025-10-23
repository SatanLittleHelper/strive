import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import type { LoginRequest, RegisterRequest } from '@/features/auth';
import { EmailPasswordProvider } from '@/features/auth/services/email-password-provider.service';
import { UserStoreService } from '@/shared';
import type { ApiError } from '@/shared/lib/types';
import type { Observable } from 'rxjs';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
}

export interface TokenInfo {
  token: string;
  payload: JwtPayload;
  isExpired: boolean;
  expiresAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userStore = inject(UserStoreService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authProvider = inject(EmailPasswordProvider);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private accessToken: string | null = null;
  private readonly AUTH_CACHE_KEY = 'auth_status_cache';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 дней

  login$(body: LoginRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authProvider.login$(body).pipe(
      tap((response) => {
        this.accessToken = response.access_token;
        this.cacheAuthStatus();
      }),
      switchMap(() => this.userStore.fetchUser$()),
      tap(() => {
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

    return this.authProvider.register$(body).pipe(
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
      this.accessToken = null;
      this.clearCachedAuthStatus();
      this.userStore.clearUser();
      void this.router.navigate(['/login']);
    };
    this.authProvider
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

  isAuthenticated(): boolean {
    if (this.accessToken) {
      return true;
    }

    return this.isCachedAuthValid();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getTokenInfo(): TokenInfo | null {
    if (!this.accessToken) {
      return null;
    }

    try {
      const payload = jwtDecode<JwtPayload>(this.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp <= currentTime;

      if (isExpired) {
        this.accessToken = null;
        return null;
      }

      return {
        token: this.accessToken,
        payload,
        isExpired: false,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch {
      this.accessToken = null;
      return null;
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  refreshToken$(): Observable<boolean> {
    return this.authProvider.refresh$().pipe(
      tap((response) => {
        this.accessToken = response.access_token;
        this.cacheAuthStatus();
      }),
      map(() => true),
      catchError((error) => {
        this.accessToken = null;
        this.userStore.clearUser();
        this.clearCachedAuthStatus();
        return throwError(() => error);
      }),
    );
  }

  private cacheAuthStatus(): void {
    const now = Date.now();
    const expiresAt = now + this.CACHE_DURATION;
    localStorage.setItem(
      this.AUTH_CACHE_KEY,
      JSON.stringify({
        timestamp: now,
        expiresAt: expiresAt,
        isAuth: true,
      }),
    );
  }

  private getCachedAuthStatus(): { timestamp: number; expiresAt: number; isAuth: boolean } | null {
    const cached = localStorage.getItem(this.AUTH_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  private isCachedAuthValid(): boolean {
    const cachedAuth = this.getCachedAuthStatus();
    if (!cachedAuth || !cachedAuth.isAuth) {
      return false;
    }
    return Date.now() <= cachedAuth.expiresAt;
  }

  private clearCachedAuthStatus(): void {
    localStorage.removeItem(this.AUTH_CACHE_KEY);
  }
}
