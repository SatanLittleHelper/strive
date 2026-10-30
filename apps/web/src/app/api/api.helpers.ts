import { API_URL_PREFIX } from './api.constants';

export function isApiUrl(url: string): boolean {
  return url.startsWith(`${API_URL_PREFIX}/`);
}
