import { HttpStatusCode } from '@angular/common/http';

export const SKELETON_ROWS: readonly number[] = [1, 2, 3];
export const SESSION_DATE_FORMAT = 'dd.MM.yyyy';
// 400 — нечисловой id, 409 — сессия ещё не завершена: для пользователя это та же «не найдено»
export const MISSING_SESSION_STATUSES: readonly number[] = [
  HttpStatusCode.NotFound,
  HttpStatusCode.BadRequest,
  HttpStatusCode.Conflict,
];
