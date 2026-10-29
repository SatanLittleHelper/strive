import type { Request } from 'express';

export interface DeviceIdRequest extends Request {
  deviceId?: string;
}
