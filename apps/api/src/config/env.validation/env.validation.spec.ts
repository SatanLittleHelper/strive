import { describe, expect, it } from 'vitest';
import { envValidationSchema } from './env.validation.js';

const VALID_DATABASE_URL = 'postgresql://strive:strive@127.0.0.1:5432/strive';
const DEFAULT_PORT = 3000;

describe('Проверка окружения', () => {
  it('принимает корректный DATABASE_URL и подставляет порт по умолчанию', () => {
    const { error, value } = envValidationSchema.validate({ DATABASE_URL: VALID_DATABASE_URL });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ DATABASE_URL: VALID_DATABASE_URL, PORT: DEFAULT_PORT });
  });

  it('требует DATABASE_URL', () => {
    const { error } = envValidationSchema.validate({});

    expect(error?.message).toContain('DATABASE_URL');
  });

  it('отклоняет URL не от Postgres', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL: 'mysql://strive:strive@127.0.0.1:3306/strive',
    });

    expect(error?.message).toContain('DATABASE_URL');
  });
});
