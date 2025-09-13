import { Injectable } from '@angular/core';
import { getTokenExpirationSeconds } from '@/shared/lib/utils';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private setCookie(name: string, value: string, expiresInSeconds: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + expiresInSeconds * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  }

  private getCookie(name: string): string | null {
    return (
      document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split('=')[1] || null
    );
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  getAccessToken(): string | null {
    return this.getCookie(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getCookie(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    debugger;
    const accessTokenExpiration = getTokenExpirationSeconds(accessToken) ?? 900; // fallback to 15 minutes
    const refreshTokenExpiration = getTokenExpirationSeconds(refreshToken) ?? 7 * 24 * 60 * 60; // fallback to 7 days

    this.setCookie(this.ACCESS_TOKEN_KEY, accessToken, accessTokenExpiration);
    this.setCookie(this.REFRESH_TOKEN_KEY, refreshToken, refreshTokenExpiration);
  }

  clearTokens(): void {
    this.deleteCookie(this.ACCESS_TOKEN_KEY);
    this.deleteCookie(this.REFRESH_TOKEN_KEY);
  }
}
