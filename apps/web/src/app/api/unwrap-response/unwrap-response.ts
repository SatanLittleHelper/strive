import { isApiResponse } from './unwrap-response.types';

const INVALID_RESPONSE_MESSAGE = 'Некорректный ответ API';
const EMPTY_RESPONSE_MESSAGE = 'Пустой ответ API';

// тело может прийти не в формате API (заглушка прокси, пустой ответ), поэтому принимаем unknown
export function unwrapResponse<T>(body: unknown): T {
  if (!isApiResponse(body)) {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  if (!body.success || body.data === null) {
    throw new Error(body.message ?? EMPTY_RESPONSE_MESSAGE);
  }

  return body.data as T;
}
