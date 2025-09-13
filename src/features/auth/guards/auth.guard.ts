import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    const url = router.url;
    if (url !== '/login' && url !== '/register') {
      sessionStorage.setItem('return_url', url);
    }

    void router.navigate(['/login']);
    return false;
  }

  return true;
};
