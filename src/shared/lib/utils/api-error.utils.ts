import { throwError, type Observable } from 'rxjs';
import type { ApiError } from '@/shared/lib/types';
import type { HttpErrorResponse } from '@angular/common/http';

export function handleApiError(error: HttpErrorResponse): Observable<never> {
  const { error: apiErrorData, message } = error;

  const actualError = apiErrorData?.error || apiErrorData;

  const apiError: ApiError = {
    code: actualError?.code || 'UNKNOWN_ERROR',
    message: actualError?.message || message || 'An unknown error occurred',
  };
  return throwError(() => apiError);
}
