import { Service } from '@angular/core';
import { isDeviceId } from '@strive/api-interfaces';
import { DEVICE_ID_STORAGE_KEY } from '../device-id.constants';

@Service()
export class DeviceIdService {
  readonly id = this.resolveId();

  private resolveId(): string {
    try {
      const savedId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

      if (savedId !== null && isDeviceId(savedId)) {
        return savedId;
      }

      const id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);

      return id;
    } catch {
      // хранилище может быть недоступно (приватный режим): идентификатор живёт до перезагрузки
      return crypto.randomUUID();
    }
  }
}
