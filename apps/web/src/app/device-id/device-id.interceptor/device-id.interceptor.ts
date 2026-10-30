import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DEVICE_ID_HEADER } from '@strive/api-interfaces';
import { isApiUrl } from '../../api';
import { DeviceIdService } from '../device-id.service';

export const deviceIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiUrl(request.url)) {
    return next(request);
  }

  const deviceId = inject(DeviceIdService).id;

  return next(request.clone({ setHeaders: { [DEVICE_ID_HEADER]: deviceId } }));
};
