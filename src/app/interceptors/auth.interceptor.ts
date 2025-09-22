import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, defer, finalize } from 'rxjs';
import { AuthService } from '@/features/auth';
import { TokenRefreshManager } from './token-refresh-manager';

import type {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import type { Observable } from 'rxjs';

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
      return new Promise<Observable<HttpEvent<unknown>>>((resolve) => {
        refreshManager.addPendingRequest(() => {
          resolve(next(req));
        });
      });
    }).pipe(switchMap((observable) => observable));
  }

  refreshManager.setRefreshInProgress(true);

  return authService.refreshToken$().pipe(
    switchMap((success) => {
      if (success) {
        refreshManager.processPendingRequests();
        return next(req);
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

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (shouldSkipAuth(req)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken = authService.getAccessToken();
  if (!accessToken) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    }),
  );
};
