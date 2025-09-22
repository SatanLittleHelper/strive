import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { firstValueFrom, map, tap } from 'rxjs';
import { AuthService } from '@/features/auth';

export const authGuard: CanMatchFn = async (): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return firstValueFrom(
    authService.refreshToken$().pipe(
      tap((refreshSuccess) => {
        if (!refreshSuccess) {
          const url = router.url;
          if (url !== '/login' && url !== '/register') {
            sessionStorage.setItem('return_url', url);
          }
          void router.navigate(['/login']);
        }
      }),
      map((refreshSuccess) => refreshSuccess),
    ),
  );
};
