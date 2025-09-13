import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    void router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
