import type { SessionExerciseResults, SetResult } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import type { FinishedSessionExercises } from '../session.types.js';
import { toSessionSummary } from './session-summary.helpers.js';

const SESSION_ID = 7;
const WORKOUT_ID = 3;
const WORKOUT_NAME = 'Тренировка X';
const STARTED_AT = '2026-10-01T10:00:00.000Z';
const FINISHED_AT = '2026-10-01T11:00:00.000Z';
const BENCH_ID = 5;
const SQUAT_ID = 7;
const BENCH_SETS = [
  { weight: 60, reps: 8 },
  { weight: 60, reps: 6 },
];
const SQUAT_SETS = [{ weight: 100, reps: 5 }];
const FRACTIONAL_SETS = [{ weight: 33.333, reps: 3 }];
const TOTAL_SETS = 3;
const TOTAL_EXERCISES = 2;
const TOTAL_VOLUME = 1340;
const ROUNDED_VOLUME = 100;

interface SetInput {
  weight: number;
  reps: number;
}

function toSets(exerciseId: number, inputs: SetInput[]): SetResult[] {
  return inputs.map(({ weight, reps }, index) => ({
    exerciseId,
    setNumber: index + 1,
    weight,
    reps,
    rpe: null,
    note: null,
    completedAt: FINISHED_AT,
  }));
}

function exercise(exerciseId: number, inputs: SetInput[]): SessionExerciseResults {
  return {
    exerciseId,
    name: `Упражнение ${exerciseId}`,
    supersetGroup: null,
    sets: toSets(exerciseId, inputs),
  };
}

function view(exercises: SessionExerciseResults[]): FinishedSessionExercises {
  return {
    id: SESSION_ID,
    workout: { id: WORKOUT_ID, name: WORKOUT_NAME },
    startedAt: STARTED_AT,
    finishedAt: FINISHED_AT,
    exercises,
  };
}

const TWO_EXERCISES = [exercise(BENCH_ID, BENCH_SETS), exercise(SQUAT_ID, SQUAT_SETS)];

describe('toSessionSummary', () => {
  it('[H2-U1] считает подходы по всем упражнениям', () => {
    expect(toSessionSummary(view(TWO_EXERCISES)).setCount).toBe(TOTAL_SETS);
  });

  it('[H2-U2] считает упражнения по элементам exercises', () => {
    expect(toSessionSummary(view(TWO_EXERCISES)).exerciseCount).toBe(TOTAL_EXERCISES);
  });

  it('[H2-U3] суммирует вес × повторы по всем подходам', () => {
    expect(toSessionSummary(view(TWO_EXERCISES)).totalVolume).toBe(TOTAL_VOLUME);
  });

  it('[H2-U4] округляет тоннаж до двух знаков', () => {
    const summary = toSessionSummary(view([exercise(BENCH_ID, FRACTIONAL_SETS)]));

    expect(summary.totalVolume).toBe(ROUNDED_VOLUME);
  });

  it('[H2-U5] даёт нули и пустой список для сессии без упражнений', () => {
    expect(toSessionSummary(view([]))).toMatchObject({
      exerciseCount: 0,
      setCount: 0,
      totalVolume: 0,
      exercises: [],
    });
  });
});
