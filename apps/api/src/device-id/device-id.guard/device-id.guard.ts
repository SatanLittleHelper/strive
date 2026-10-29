import {
  BadRequestException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { DEVICE_ID_HEADER, isDeviceId } from '@strive/api-interfaces';
import type { DeviceIdRequest } from '../device-id.types.js';

@Injectable()
export class DeviceIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<DeviceIdRequest>();
    const deviceId = request.header(DEVICE_ID_HEADER);

    if (deviceId === undefined || !isDeviceId(deviceId)) {
      throw new BadRequestException(
        `Заголовок ${DEVICE_ID_HEADER} должен содержать UUID устройства`,
      );
    }

    request.deviceId = deviceId;

    return true;
  }
}
