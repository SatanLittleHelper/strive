import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, defer, finalize } from 'rxjs';
import { AuthApiService } from '@/features/auth';

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

class TokenRefreshManager {
  private refreshInProgress = false;
  private pendingRequests: Array<() => void> = [];
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

  addPendingRequest(request: () => void): void {
    this.pendingRequests.push(request);
  }

  processPendingRequests(): void {
    this.pendingRequests.forEach((request) => request());
    this.pendingRequests = [];
  }

  clearPendingRequests(): void {
    this.pendingRequests = [];
  }
}

const logout = (router: Router): void => {
  void router.navigate(['/login']);
};

const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authApi: AuthApiService,
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

  return authApi.refresh$().pipe(
    switchMap(() => {
      refreshManager.processPendingRequests();
      return next(req);
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

  const authApi = inject(AuthApiService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(req, next, authApi, router);
      }
      return throwError(() => error);
    }),
  );
};
