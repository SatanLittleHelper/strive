import type { SetResult, WorkoutExercise, WorkoutSession } from '@strive/api-interfaces';

export const PLAN_SETS = 3;
const PLAN_REPS = 8;
const COMPLETED_AT = '2026-11-01T10:00:00.000Z';

export function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function planExercise({
  id,
  sets = PLAN_SETS,
}: {
  id: number;
  sets?: number;
}): WorkoutExercise {
  return {
    exercise: { id, name: `Упражнение ${id}` },
    position: id,
    sets,
    reps: PLAN_REPS,
    weight: null,
  };
}

export function setsOf({
  exerciseId,
  setNumbers,
}: {
  exerciseId: number;
  setNumbers: number[];
}): SetResult[] {
  return setNumbers.map((setNumber) => ({
    exerciseId,
    setNumber,
    weight: 60,
    reps: PLAN_REPS,
    rpe: null,
    note: null,
    completedAt: COMPLETED_AT,
  }));
}

export function sessionOf({
  exercises,
  results,
}: {
  exercises: WorkoutExercise[];
  results: SetResult[];
}): WorkoutSession {
  return {
    id: 1,
    workout: { id: 1, name: 'Тренировка', description: null, exercises },
    startedAt: COMPLETED_AT,
    finishedAt: null,
    results,
  };
}
