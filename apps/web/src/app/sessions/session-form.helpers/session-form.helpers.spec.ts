import { SET_RESULT_LIMITS, type WorkoutSession } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { countCompletedSets, findResult, validateSetInput } from './session-form.helpers';

const RAW = { weight: '60.25', reps: '8', rpe: '3', note: 'Легко' };
const EXERCISE_ID = 1;
const SET_NUMBER = 1;
const RESULT = {
  exerciseId: EXERCISE_ID,
  setNumber: SET_NUMBER,
  weight: 60.25,
  reps: 8,
  rpe: 3,
  note: 'Легко',
  completedAt: '2026-10-30T12:00:00.000Z',
};
const SESSION: WorkoutSession = {
  id: 1,
  workout: {
    id: 1,
    name: 'Тренировка',
    description: null,
    exercises: [
      { exercise: { id: EXERCISE_ID, name: 'Жим' }, position: 1, sets: 3, repsMin: 6, repsMax: 8 },
    ],
  },
  startedAt: RESULT.completedAt,
  finishedAt: null,
  results: [RESULT],
};

describe('Валидация подхода', () => {
  it('преобразует строки в запрос', () => {
    expect(validateSetInput(RAW)).toEqual({
      ok: true,
      value: { weight: 60.25, reps: 8, rpe: 3, note: 'Легко' },
    });
  });

  it('допускает нулевой вес и незаполненные необязательные поля', () => {
    expect(validateSetInput({ weight: '0', reps: '1', rpe: '', note: '' })).toEqual({
      ok: true,
      value: { weight: 0, reps: 1, rpe: null, note: null },
    });
  });

  it('принимает верхние границы', () => {
    expect(
      validateSetInput({
        weight: String(SET_RESULT_LIMITS.weightMax),
        reps: String(SET_RESULT_LIMITS.repsMax),
        rpe: String(SET_RESULT_LIMITS.rpeMax),
        note: 'x'.repeat(SET_RESULT_LIMITS.noteMaxLength),
      }).ok,
    ).toBe(true);
  });

  it.each([
    { weight: '' },
    { weight: ' ' },
    { weight: '-1' },
    { weight: '10000' },
    { weight: 'NaN' },
    { weight: 'Infinity' },
    { weight: '0.001' },
    { reps: '' },
    { reps: '0' },
    { reps: '1000' },
    { reps: '1.5' },
    { reps: 'abc' },
    { rpe: '0' },
    { rpe: '6' },
    { rpe: '1.5' },
    { rpe: 'abc' },
    { note: 'x'.repeat(SET_RESULT_LIMITS.noteMaxLength + 1) },
  ])('отклоняет некорректное значение %j', (invalid) => {
    const result = validateSetInput({ ...RAW, ...invalid });
    expect(result).toMatchObject({ ok: false, error: expect.any(String) });
  });

  it('принимает десятичную запятую', () => {
    expect(validateSetInput({ ...RAW, weight: '60,25' })).toMatchObject({
      ok: true,
      value: { weight: 60.25 },
    });
  });
});

describe('Результаты тренировки', () => {
  it('считает сохранённые подходы', () => {
    expect(countCompletedSets(SESSION)).toBe(1);
    expect(countCompletedSets({ ...SESSION, results: [] })).toBe(0);
  });

  it('находит результат по упражнению и номеру подхода', () => {
    expect(findResult(SESSION, EXERCISE_ID, SET_NUMBER)).toEqual(RESULT);
    expect(findResult(SESSION, EXERCISE_ID, SET_NUMBER + 1)).toBeUndefined();
    expect(findResult(SESSION, EXERCISE_ID + 1, SET_NUMBER)).toBeUndefined();
  });
});
