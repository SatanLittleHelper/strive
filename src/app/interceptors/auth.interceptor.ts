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

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'] as const;

const createAuthenticatedRequest = (
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> => {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
};

const shouldSkipAuth = (req: HttpRequest<unknown>): boolean => {
  return AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));
};

let refreshInProgress = false;
let pendingRequests: Array<() => void> = [];

const processPendingRequests = (): void => {
  pendingRequests.forEach((request) => request());
  pendingRequests = [];
};

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
  if (refreshInProgress) {
    return defer(() => {
      return new Promise<Observable<HttpEvent<unknown>>>((resolve) => {
        pendingRequests.push(() => {
          resolve(next(req));
        });
      });
    }).pipe(switchMap((observable) => observable));
  }

  refreshInProgress = true;

  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    logout(router, tokenStorage);
    return throwError(() => new Error('No refresh token'));
  }

  return authApi.refresh$(refreshToken).pipe(
    switchMap((response: RefreshResponse) => {
      tokenStorage.setTokens(response.access_token, refreshToken);
      processPendingRequests();

      const newReq = createAuthenticatedRequest(req, response.access_token);
      return next(newReq);
    }),
    catchError((error) => {
      processPendingRequests();
      logout(router, tokenStorage);
      return throwError(() => error);
    }),
    finalize(() => {
      refreshInProgress = false;
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
