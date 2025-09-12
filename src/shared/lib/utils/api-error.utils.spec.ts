import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '@/shared/lib/types';
import { handleApiError } from './api-error.utils';

describe('handleApiError', () => {
  it('should handle simple error response', () => {
    const error = new HttpErrorResponse({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      status: 401,
      statusText: 'Unauthorized',
    });

    handleApiError(error).subscribe({
      error: (apiError: ApiError) => {
        expect(apiError.code).toBe('INVALID_CREDENTIALS');
        expect(apiError.message).toBe('Invalid email or password');
      },
    });
  });

  it('should handle nested error structure', () => {
    const error = new HttpErrorResponse({
      error: {
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
      },
      status: 400,
      statusText: 'Bad Request',
    });

    handleApiError(error).subscribe({
      error: (apiError: ApiError) => {
        expect(apiError.code).toBe('VALIDATION_ERROR');
        expect(apiError.message).toBe('Email is required');
      },
    });
  });

  it('should handle error without nested structure', () => {
    const error = new HttpErrorResponse({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
      status: 500,
      statusText: 'Internal Server Error',
    });

    handleApiError(error).subscribe({
      error: (apiError: ApiError) => {
        expect(apiError.code).toBe('SERVER_ERROR');
        expect(apiError.message).toBe('Internal server error');
      },
    });
  });

  it('should handle error with fallback values', () => {
    const error = new HttpErrorResponse({
      error: {},
      status: 500,
      statusText: 'Internal Server Error',
    });

    handleApiError(error).subscribe({
      error: (apiError: ApiError) => {
        expect(apiError.code).toBe('UNKNOWN_ERROR');
        expect(apiError.message).toBe(
          'Http failure response for (unknown url): 500 Internal Server Error',
        );
      },
    });
  });

  it('should use HttpErrorResponse message as fallback', () => {
    const error = new HttpErrorResponse({
      error: { code: 'NETWORK_ERROR' },
      status: 0,
      statusText: 'Unknown Error',
    });

    handleApiError(error).subscribe({
      error: (apiError: ApiError) => {
        expect(apiError.code).toBe('NETWORK_ERROR');
        expect(apiError.message).toBe('Http failure response for (unknown url): 0 Unknown Error');
      },
    });
  });
});
