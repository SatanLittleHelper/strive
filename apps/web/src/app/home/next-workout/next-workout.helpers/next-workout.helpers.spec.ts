import type { WorkoutSession, WorkoutSummary } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { sessionOf } from '../../../sessions/test-support/session.fixtures';
import { getNextWorkout } from './next-workout.helpers';

const LEGS = { id: 1, name: 'Ноги', description: null, exerciseCount: 5 };
const BACK = { id: 2, name: 'Спина', description: null, exerciseCount: 5 };
const CHEST = { id: 3, name: 'Грудь', description: null, exerciseCount: 5 };
const CATALOG: WorkoutSummary[] = [LEGS, BACK, CHEST];

function finishedOf(workoutId: number, finishedAt: string): WorkoutSession {
  const base = sessionOf({ exercises: [], results: [] });

  return { ...base, workout: { ...base.workout, id: workoutId }, finishedAt };
}

describe('Следующая тренировка', () => {
  it('[rf-U9] выбирается следующая после последней завершённой', () => {
    const finished = [finishedOf(BACK.id, '2026-11-10T10:00:00.000Z')];

    expect(getNextWorkout({ workouts: CATALOG, finished })).toEqual(CHEST);
  });

  it('[rf-U10] после последней в каталоге выбирается первая', () => {
    const finished = [finishedOf(CHEST.id, '2026-11-10T10:00:00.000Z')];

    expect(getNextWorkout({ workouts: CATALOG, finished })).toEqual(LEGS);
  });

  it('[rf-U11] без завершённых тренировок выбирается первая', () => {
    expect(getNextWorkout({ workouts: CATALOG, finished: [] })).toEqual(LEGS);
  });

  it('[rf-U12] если последней завершённой нет в каталоге, выбирается первая', () => {
    const finished = [finishedOf(99, '2026-11-10T10:00:00.000Z')];

    expect(getNextWorkout({ workouts: CATALOG, finished })).toEqual(LEGS);
  });

  it('[rf-U13] пустой каталог не даёт тренировки', () => {
    const finished = [finishedOf(BACK.id, '2026-11-10T10:00:00.000Z')];

    expect(getNextWorkout({ workouts: [], finished })).toBeNull();
  });

  it('[rf-U14] ориентиром служит самая поздняя по завершению, а не порядок списка', () => {
    const finished = [
      finishedOf(CHEST.id, '2026-11-01T10:00:00.000Z'),
      finishedOf(BACK.id, '2026-11-12T10:00:00.000Z'),
    ];

    expect(getNextWorkout({ workouts: CATALOG, finished })).toEqual(CHEST);
  });
});
