import type { ApiResponse } from '@strive/api-interfaces';

export function isApiResponse(value: unknown): value is ApiResponse {
  return typeof value === 'object' && value !== null && 'success' in value;
}
