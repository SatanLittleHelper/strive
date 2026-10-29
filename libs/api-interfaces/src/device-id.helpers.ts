import { DEVICE_ID_PATTERN } from './device-id.constants.js';

export function isDeviceId(value: string): boolean {
  return DEVICE_ID_PATTERN.test(value);
}
