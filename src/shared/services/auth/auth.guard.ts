import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanMatchFn = (): boolean => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const accessToken = tokenStorage.getAccessToken();

  if (!accessToken) {
    // Save the attempted URL for redirect after login
    const url = router.url;
    sessionStorage.setItem('return_url', url);

    // Redirect to login
    void router.navigate(['/login']);
    return false;
  }

  return true;
};
