import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';
import type { DeviceIdRequest } from './device-id.types.js';

export const DeviceId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { deviceId } = context.switchToHttp().getRequest<DeviceIdRequest>();

    if (deviceId === undefined) {
      throw new InternalServerErrorException('DeviceIdGuard не применён к маршруту');
    }

    return deviceId;
  },
);
