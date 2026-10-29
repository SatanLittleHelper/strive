import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { API_URL_PREFIX } from '../device-id.constants';
import { DeviceIdService } from '../device-id.service';

export const deviceIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${API_URL_PREFIX}/`)) {
    return next(request);
  }

  const deviceId = inject(DeviceIdService).id;

  return next(request.clone({ setHeaders: { [DEVICE_ID_HEADER]: deviceId } }));
};
