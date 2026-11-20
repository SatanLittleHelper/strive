import type { SetResult, WorkoutSession } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { toSharedSession } from './shared-session.helpers.js';

const STARTED_AT = '2026-11-02T12:00:00.000Z';
const FINISHED_AT = '2026-11-02T13:00:00.000Z';
const NOTE = 'Болит колено';
const FIRST_ROW = 1;
const SECOND_ROW = 2;
const SHARED_TOTAL_VOLUME = 60 * 8 + 50 * 10;

function setOf(overrides: Partial<SetResult>): SetResult {
  return {
    workoutExerciseId: FIRST_ROW,
    setNumber: 1,
    weight: 60,
    reps: 8,
    rpe: 3,
    note: null,
    completedAt: STARTED_AT,
    ...overrides,
  };
}

function sessionOf(overrides: Partial<WorkoutSession>): WorkoutSession {
  return {
    id: 7,
    workout: {
      id: 1,
      name: 'Грудь',
      description: null,
      exercises: [
        {
          id: FIRST_ROW,
          exercise: { id: 1, name: 'Жим' },
          occurrence: 1,
          sets: 3,
          reps: 8,
          weight: 60,
          supersetGroup: null,
        },
        {
          id: SECOND_ROW,
          exercise: { id: 2, name: 'Разводка' },
          occurrence: 1,
          sets: 3,
          reps: 10,
          weight: 50,
          supersetGroup: null,
        },
      ],
    },
    startedAt: STARTED_AT,
    finishedAt: null,
    results: [],
    share: { token: 'secret-token', expiresAt: FINISHED_AT },
    ...overrides,
  };
}

describe('Публичное представление сессии', () => {
  it('[ss-U2] убирает заметки, сохраняя вес, повторы и RPE', () => {
    const shared = toSharedSession(
      sessionOf({ results: [setOf({ note: NOTE }), setOf({ setNumber: 2, note: null })] }),
    );

    expect(shared.results).toHaveLength(2);
    for (const result of shared.results) {
      expect(result).not.toHaveProperty('note');
    }
    expect(shared.results[0]).toMatchObject({ weight: 60, reps: 8, rpe: 3 });
  });

  it('[ss-U3] активная сессия отдаётся без сводки', () => {
    const shared = toSharedSession(sessionOf({ results: [setOf({})] }));

    expect(shared.finishedAt).toBeNull();
    expect(shared).not.toHaveProperty('exerciseCount');
    expect(shared).not.toHaveProperty('setCount');
    expect(shared).not.toHaveProperty('totalVolume');
  });

  it('[ss-U4] завершённая сессия отдаётся со сводкой', () => {
    const shared = toSharedSession(
      sessionOf({
        finishedAt: FINISHED_AT,
        results: [
          setOf({ workoutExerciseId: FIRST_ROW, weight: 60, reps: 8 }),
          setOf({ workoutExerciseId: SECOND_ROW, weight: 50, reps: 10 }),
        ],
      }),
    );

    expect(shared).toMatchObject({
      finishedAt: FINISHED_AT,
      exerciseCount: 2,
      setCount: 2,
      totalVolume: SHARED_TOTAL_VOLUME,
    });
  });
});
