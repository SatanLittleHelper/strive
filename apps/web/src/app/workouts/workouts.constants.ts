import { HttpStatusCode } from '@angular/common/http';
import { API_URL_PREFIX } from '../api';

export const WORKOUTS_URL = `${API_URL_PREFIX}/workouts`;
export const SKELETON_ROWS: readonly number[] = [1, 2, 3];
// 400 даёт нечисловой или нулевой id в адресе: для пользователя это та же «не найдено»
export const MISSING_WORKOUT_STATUSES: readonly number[] = [
  HttpStatusCode.NotFound,
  HttpStatusCode.BadRequest,
];
