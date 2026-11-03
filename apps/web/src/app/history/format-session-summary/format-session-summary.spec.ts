import type { SetResult } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatSessionSummary,
  formatSetCount,
  formatVolume,
} from './format-session-summary';

const FIRST_EXERCISE_ID = 1;
const SECOND_EXERCISE_ID = 2;
const STARTED_AT = '2026-10-01T10:00:00.000Z';
const AFTER_72_MINUTES = '2026-10-01T11:12:00.000Z';
const AFTER_45_MINUTES = '2026-10-01T10:45:00.000Z';
const AFTER_20_SECONDS = '2026-10-01T10:00:20.000Z';
const THOUSANDS_VOLUME = 7450;
const FRACTIONAL_VOLUME = 1234.5;

function setOf(exerciseId: number, setNumber: number): SetResult {
  return {
    exerciseId,
    setNumber,
    weight: 60,
    reps: 8,
    rpe: null,
    note: null,
    completedAt: STARTED_AT,
  };
}

describe('formatSetCount', () => {
  it.each([
    [0, '0 подходов'],
    [1, '1 подход'],
    [2, '2 подхода'],
    [5, '5 подходов'],
    [11, '11 подходов'],
    [21, '21 подход'],
  ])('[H2-U6] склоняет число подходов %i', (count, expected) => {
    expect(formatSetCount(count)).toBe(expected);
  });
});

describe('formatSessionSummary', () => {
  it('[H2-U7] считает уникальные упражнения и все подходы', () => {
    const results = [
      setOf(FIRST_EXERCISE_ID, 1),
      setOf(FIRST_EXERCISE_ID, 2),
      setOf(SECOND_EXERCISE_ID, 1),
    ];

    expect(formatSessionSummary(results)).toBe('2 упражнения · 3 подхода');
  });

  it('[H2-U8] показывает нули для сессии без подходов', () => {
    expect(formatSessionSummary([])).toBe('0 упражнений · 0 подходов');
  });
});

describe('formatDuration', () => {
  it('[H2-U9] показывает часы и минуты', () => {
    expect(formatDuration(STARTED_AT, AFTER_72_MINUTES)).toBe('1 ч 12 мин');
  });

  it('[H2-U10] не показывает часы, если прошло меньше часа', () => {
    expect(formatDuration(STARTED_AT, AFTER_45_MINUTES)).toBe('45 мин');
  });

  it('[H2-U11] пишет «меньше минуты» для очень короткой тренировки', () => {
    expect(formatDuration(STARTED_AT, AFTER_20_SECONDS)).toBe('меньше минуты');
  });
});

describe('formatVolume', () => {
  it('[H2-U12] отделяет разряды тысяч неразрывным пробелом', () => {
    expect(formatVolume(THOUSANDS_VOLUME)).toBe('7 450 кг');
  });

  it('[H2-U13] показывает дробный тоннаж с запятой', () => {
    expect(formatVolume(FRACTIONAL_VOLUME)).toBe('1 234,5 кг');
  });
});
