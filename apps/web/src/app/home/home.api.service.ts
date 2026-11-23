import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import type { HomeResponse } from '@strive/api-interfaces';
import { API_URL_PREFIX } from '../api';

@Service()
export class HomeApiService {
  getHome() {
    return httpResource<HomeResponse>(() => `${API_URL_PREFIX}/home`);
  }
}
