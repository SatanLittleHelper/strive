import type {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import type { Observable } from 'rxjs';

export const credentialsInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.withCredentials === true) {
    return next(req);
  }

  const modifiedReq = req.clone({
    withCredentials: true,
    setHeaders: {
      'Content-Type': 'application/json',
    },
  });

  return next(modifiedReq);
};
