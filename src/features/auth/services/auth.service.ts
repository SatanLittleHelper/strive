import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { tap, catchError, of, finalize, map } from 'rxjs';
import { AuthApiService } from '@/features/auth';
import type { LoginRequest, RegisterRequest } from '@/features/auth';
import type { ApiError } from '@/shared/lib/types';
import type { Observable } from 'rxjs';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private accessToken: string | null = null;

  login$(body: LoginRequest): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.authApi.login$(body).pipe(
      tap((response) => {
        this.accessToken = response.access_token;
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
      this.accessToken = null;
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

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(this.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp <= currentTime) {
        this.accessToken = null;
        return null;
      }
      return this.accessToken;
    } catch {
      this.accessToken = null;
      return null;
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  refreshToken$(): Observable<boolean> {
    return this.authApi.refresh$().pipe(
      tap((response) => {
        this.accessToken = response.access_token;
      }),
      map(() => true),
      catchError(() => {
        this.accessToken = null;
        return of(false);
      }),
    );
  }
}
