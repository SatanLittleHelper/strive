import type { SetResult } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import type { FinishedWorkoutSession } from '../session.types.js';
import { toSessionSummary } from './session-summary.helpers.js';

const SESSION_ID = 7;
const WORKOUT_ID = 3;
const WORKOUT_NAME = 'Тренировка X';
const STARTED_AT = '2026-10-01T10:00:00.000Z';
const FINISHED_AT = '2026-10-01T11:00:00.000Z';
const FIRST_EXERCISE_ID = 5;
const SECOND_EXERCISE_ID = 7;
const FOUR_SETS = 4;
const FLOAT_ARTIFACT_WEIGHT = 0.1;
const THREE_REPS = 3;
const FRACTIONAL_WEIGHT = 33.333;
const ROUNDED_VOLUME = 100.3;
const PLAIN_VOLUME = 855;
const SET_WEIGHT = 10;
const SET_REPS = 10;
const TWO_EXERCISES = 2;

interface SetInput {
  exerciseId: number;
  weight: number;
  reps: number;
}

function plainSet(exerciseId: number): SetInput {
  return { exerciseId, weight: SET_WEIGHT, reps: SET_REPS };
}

function set({ exerciseId, weight, reps }: SetInput, index: number): SetResult {
  return {
    exerciseId,
    setNumber: index + 1,
    weight,
    reps,
    rpe: null,
    note: null,
    completedAt: FINISHED_AT,
  };
}

function session(sets: SetInput[]): FinishedWorkoutSession {
  return {
    id: SESSION_ID,
    workout: { id: WORKOUT_ID, name: WORKOUT_NAME, description: null, exercises: [] },
    startedAt: STARTED_AT,
    finishedAt: FINISHED_AT,
    results: sets.map(set),
  };
}

describe('toSessionSummary', () => {
  it('[U1] считает число подходов', () => {
    const sets = Array.from({ length: FOUR_SETS }, () => plainSet(FIRST_EXERCISE_ID));

    expect(toSessionSummary(session(sets)).setCount).toBe(FOUR_SETS);
  });

  it('[U2] считает упражнения без повторов', () => {
    const summary = toSessionSummary(
      session([
        plainSet(FIRST_EXERCISE_ID),
        plainSet(FIRST_EXERCISE_ID),
        plainSet(SECOND_EXERCISE_ID),
      ]),
    );

    expect(summary.exerciseCount).toBe(TWO_EXERCISES);
  });

  it('[U3] суммирует вес × повторы по всем подходам', () => {
    const summary = toSessionSummary(
      session([
        { exerciseId: FIRST_EXERCISE_ID, weight: 60, reps: 8 },
        { exerciseId: FIRST_EXERCISE_ID, weight: 62.5, reps: 6 },
      ]),
    );

    expect(summary.totalVolume).toBe(PLAIN_VOLUME);
  });

  it('[U4] округляет тоннаж до двух знаков', () => {
    const summary = toSessionSummary(
      session([
        { exerciseId: FIRST_EXERCISE_ID, weight: FLOAT_ARTIFACT_WEIGHT, reps: THREE_REPS },
        { exerciseId: FIRST_EXERCISE_ID, weight: FRACTIONAL_WEIGHT, reps: THREE_REPS },
      ]),
    );

    expect(summary.totalVolume).toBe(ROUNDED_VOLUME);
  });

  it('[U5] даёт нули для сессии без подходов', () => {
    expect(toSessionSummary(session([]))).toMatchObject({
      setCount: 0,
      exerciseCount: 0,
      totalVolume: 0,
    });
  });
});
