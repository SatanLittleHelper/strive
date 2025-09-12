import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

export const guestGuard: CanMatchFn = (): boolean => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    // User is already authenticated, redirect to dashboard
    void router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
