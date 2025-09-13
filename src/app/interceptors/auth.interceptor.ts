import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, defer, finalize } from 'rxjs';
import { AuthApiService, type RefreshResponse } from '@/features/auth';
import { TokenStorageService } from '@/shared/services/auth/token-storage.service';

import type {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import type { Observable } from 'rxjs';

const AUTH_ENDPOINTS = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh'] as const;

const createAuthenticatedRequest = (
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> => {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
};

const shouldSkipAuth = (req: HttpRequest<unknown>): boolean => {
  return AUTH_ENDPOINTS.some((endpoint) => req.url.endsWith(endpoint));
};

class TokenRefreshManager {
  private refreshInProgress = false;
  private pendingRequests: Array<(accessToken: string) => void> = [];
  private static instance: TokenRefreshManager;

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  get isRefreshInProgress(): boolean {
    return this.refreshInProgress;
  }

  setRefreshInProgress(value: boolean): void {
    this.refreshInProgress = value;
  }

  addPendingRequest(request: (accessToken: string) => void): void {
    this.pendingRequests.push(request);
  }

  processPendingRequests(newAccessToken: string): void {
    this.pendingRequests.forEach((request) => request(newAccessToken));
    this.pendingRequests = [];
  }

  clearPendingRequests(): void {
    this.pendingRequests = [];
  }
}

const logout = (router: Router, tokenStorage: TokenStorageService): void => {
  tokenStorage.clearTokens();
  void router.navigate(['/login']);
};

const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  authApi: AuthApiService,
  router: Router,
): Observable<HttpEvent<unknown>> => {
  const refreshManager = TokenRefreshManager.getInstance();

  if (refreshManager.isRefreshInProgress) {
    return defer(() => {
      return new Promise<Observable<HttpEvent<unknown>>>((resolve) => {
        refreshManager.addPendingRequest((newAccessToken: string) => {
          const newReq = createAuthenticatedRequest(req, newAccessToken);
          resolve(next(newReq));
        });
      });
    }).pipe(switchMap((observable) => observable));
  }

  refreshManager.setRefreshInProgress(true);

  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    refreshManager.setRefreshInProgress(false);
    logout(router, tokenStorage);
    return throwError(() => new Error('No refresh token'));
  }

  return authApi.refresh$(refreshToken).pipe(
    switchMap((response: RefreshResponse) => {
      tokenStorage.setTokens(response.access_token, refreshToken);
      refreshManager.processPendingRequests(response.access_token);

      const newReq = createAuthenticatedRequest(req, response.access_token);
      return next(newReq);
    }),
    catchError((error) => {
      refreshManager.clearPendingRequests();
      logout(router, tokenStorage);
      return throwError(() => error);
    }),
    finalize(() => {
      refreshManager.setRefreshInProgress(false);
    }),
  );
};

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (shouldSkipAuth(req)) {
    return next(req);
  }

  const tokenStorage = inject(TokenStorageService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    req = createAuthenticatedRequest(req, accessToken);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(req, next, tokenStorage, authApi, router);
      }
      return throwError(() => error);
    }),
  );
};
