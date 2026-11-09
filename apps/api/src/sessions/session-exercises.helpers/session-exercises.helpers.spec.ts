import type { SetResult, WorkoutExercise } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import type { FinishedWorkoutSession } from '../session.types.js';
import { toFinishedSessionExercises } from './session-exercises.helpers.js';

const GROUP = 1;
const SECOND_GROUP = 2;
const COMPLETED_AT = '2026-11-09T10:00:00.000Z';
const FIRST_ID = 1;
const SECOND_ID = 2;
const THIRD_ID = 3;
const EMPTY_ID = 4;

function planItem({
  id,
  position,
  supersetGroup,
}: {
  id: number;
  position: number;
  supersetGroup: number | null;
}): WorkoutExercise {
  return {
    exercise: { id, name: `Упражнение ${id}` },
    position,
    sets: 2,
    reps: 8,
    weight: null,
    supersetGroup,
  };
}

function twoSets(exerciseId: number): SetResult[] {
  return [1, 2].map((setNumber) => ({
    exerciseId,
    setNumber,
    weight: 60,
    reps: 8,
    rpe: null,
    note: null,
    completedAt: COMPLETED_AT,
  }));
}

describe('Сводка завершённой сессии: toFinishedSessionExercises', () => {
  it('[U11] группирует упражнения по плану и передаёт группу', () => {
    const session: FinishedWorkoutSession = {
      id: 1,
      workout: {
        id: 1,
        name: 'Тренировка',
        description: null,
        exercises: [
          planItem({ id: FIRST_ID, position: 1, supersetGroup: GROUP }),
          planItem({ id: SECOND_ID, position: 2, supersetGroup: GROUP }),
          planItem({ id: THIRD_ID, position: 3, supersetGroup: null }),
          planItem({ id: EMPTY_ID, position: 4, supersetGroup: SECOND_GROUP }),
        ],
      },
      startedAt: COMPLETED_AT,
      finishedAt: COMPLETED_AT,
      results: [...twoSets(FIRST_ID), ...twoSets(SECOND_ID), ...twoSets(THIRD_ID)],
    };

    const { exercises } = toFinishedSessionExercises(session);

    expect(exercises.map(({ exerciseId, supersetGroup }) => [exerciseId, supersetGroup])).toEqual([
      [FIRST_ID, GROUP],
      [SECOND_ID, GROUP],
      [THIRD_ID, null],
    ]);
  });
});
