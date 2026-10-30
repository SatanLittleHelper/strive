import {
  HttpResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { map } from 'rxjs';
import { isApiUrl } from '../api.helpers';
import { unwrapResponse } from '../unwrap-response';

// пустые ответы (204) и не-JSON (text, blob) конверта не содержат
function isJsonBody(
  request: HttpRequest<unknown>,
  event: HttpEvent<unknown>,
): event is HttpResponse<unknown> {
  return event instanceof HttpResponse && event.body !== null && request.responseType === 'json';
}

export const unwrapResponseInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiUrl(request.url)) {
    return next(request);
  }

  return next(request).pipe(
    map((event) =>
      isJsonBody(request, event) ? event.clone({ body: unwrapResponse(event.body) }) : event,
    ),
  );
};
