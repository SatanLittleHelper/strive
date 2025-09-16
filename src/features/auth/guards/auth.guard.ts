import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '@/features/auth';

export const authGuard: CanMatchFn = async (): Promise<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticatedAndValid();

  if (!isAuthenticated) {
    const url = router.url;
    if (url !== '/login' && url !== '/register') {
      sessionStorage.setItem('return_url', url);
    }
    void router.navigate(['/login']);
    return false;
  }

  return true;
};
