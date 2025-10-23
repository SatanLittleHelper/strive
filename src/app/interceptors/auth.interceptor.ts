import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, defer, finalize, Observable } from 'rxjs';
import { AuthService, type TokenInfo } from '@/features/auth';
import { TokenRefreshManager } from './token-refresh-manager';

import type {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';

const AUTH_ENDPOINTS = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh'] as const;
const shouldSkipAuth = (req: HttpRequest<unknown>): boolean => {
  return AUTH_ENDPOINTS.some((endpoint) => req.url.endsWith(endpoint));
};

const logout = (router: Router): void => {
  void router.navigate(['/login']);
};

const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> => {
  const refreshManager = TokenRefreshManager.getInstance();

  if (refreshManager.isRefreshInProgress) {
    return defer(() => {
      return new Observable<Observable<HttpEvent<unknown>>>((subscriber) => {
        refreshManager.addPendingRequest(() => {
          const authReq = createAuthRequest(req, authService);
          subscriber.next(next(authReq));
          subscriber.complete();
        });
      });
    }).pipe(switchMap((observable) => observable));
  }

  refreshManager.setRefreshInProgress(true);

  return authService.refreshToken$().pipe(
    switchMap((success) => {
      if (success) {
        refreshManager.processPendingRequests();
        const authReq = createAuthRequest(req, authService);
        return next(authReq);
      } else {
        refreshManager.clearPendingRequests();
        logout(router);
        return throwError(() => new Error('Token refresh failed'));
      }
    }),
    catchError((error) => {
      refreshManager.clearPendingRequests();
      logout(router);
      return throwError(() => error);
    }),
    finalize(() => {
      refreshManager.setRefreshInProgress(false);
    }),
  );
};

const isTokenExpiringSoon = (tokenInfo: TokenInfo | null, minutesBeforeExpiry = 5): boolean => {
  if (!tokenInfo) {
    return false;
  }

  try {
    const now = new Date();
    const timeUntilExpiry = tokenInfo.expiresAt.getTime() - now.getTime();
    const minutesInMilliseconds = minutesBeforeExpiry * 60 * 1000;

    return timeUntilExpiry <= minutesInMilliseconds && timeUntilExpiry > 0;
  } catch {
    return true;
  }
};

const createAuthRequest = (
  req: HttpRequest<unknown>,
  authService: AuthService,
): HttpRequest<unknown> => {
  const tokenInfo = authService.getTokenInfo();
  return tokenInfo
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${tokenInfo.token}`,
        },
      })
    : req;
};

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (shouldSkipAuth(req)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  const tokenInfo = authService.getTokenInfo();

  if (isTokenExpiringSoon(tokenInfo, 5)) {
    const refreshManager = TokenRefreshManager.getInstance();

    if (!refreshManager.isRefreshInProgress) {
      refreshManager.setRefreshInProgress(true);
      authService
        .refreshToken$()
        .pipe(
          finalize(() => {
            refreshManager.setRefreshInProgress(false);
          }),
        )
        .subscribe();
    }
  }

  const authReq = createAuthRequest(req, authService);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    }),
  );
};
