import { describe, expect, it } from 'vitest';
import type { ApiResponse } from '@strive/api-interfaces';
import { unwrapResponse } from './unwrap-response';

const INVALID_MESSAGE = 'Некорректный ответ API';
const EMPTY_MESSAGE = 'Пустой ответ API';
const DATA = { id: 1 };

function createResponse(overrides: Partial<ApiResponse<typeof DATA>>): ApiResponse<typeof DATA> {
  return { success: true, message: null, data: DATA, details: null, ...overrides };
}

describe('unwrapResponse', () => {
  it.each([null, undefined, '<html>заглушка</html>', 42])(
    'бросает ошибку формата, если тело %s не в формате API',
    (body) => {
      expect(() => unwrapResponse(body)).toThrow(INVALID_MESSAGE);
    },
  );

  it('возвращает данные успешного ответа', () => {
    expect(unwrapResponse<typeof DATA>(createResponse({}))).toBe(DATA);
  });

  it('бросает ошибку с сообщением API, если ответ неуспешный', () => {
    const response = createResponse({ success: false, message: 'Сбой', data: null });

    expect(() => unwrapResponse(response)).toThrow('Сбой');
  });

  it('бросает ошибку по умолчанию, если у неуспешного ответа нет сообщения', () => {
    const response = createResponse({ success: false, data: null });

    expect(() => unwrapResponse(response)).toThrow(EMPTY_MESSAGE);
  });

  it('бросает ошибку по умолчанию, если в успешном ответе нет данных', () => {
    expect(() => unwrapResponse(createResponse({ data: null }))).toThrow(EMPTY_MESSAGE);
  });
});
