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
const FIRST_ROW_SET_COUNT = 2;
const SECOND_ROW_SET_NUMBERS = [1, 2, 3];
const THIRD_ROW_SET_COUNT = 1;

function planItem({
  rowId,
  exerciseId,
  occurrence,
  supersetGroup,
}: {
  rowId: number;
  exerciseId: number;
  occurrence: number;
  supersetGroup: number | null;
}): WorkoutExercise {
  return {
    id: rowId,
    exercise: { id: exerciseId, name: `Упражнение ${exerciseId}` },
    occurrence,
    sets: 2,
    reps: 8,
    weight: null,
    supersetGroup,
  };
}

function twoSets(workoutExerciseId: number, setNumbers = [1, 2]): SetResult[] {
  return setNumbers.map((setNumber) => ({
    workoutExerciseId,
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
          planItem({ rowId: FIRST_ID, exerciseId: FIRST_ID, occurrence: 1, supersetGroup: GROUP }),
          planItem({
            rowId: SECOND_ID,
            exerciseId: SECOND_ID,
            occurrence: 1,
            supersetGroup: GROUP,
          }),
          planItem({ rowId: THIRD_ID, exerciseId: THIRD_ID, occurrence: 1, supersetGroup: null }),
          planItem({
            rowId: EMPTY_ID,
            exerciseId: EMPTY_ID,
            occurrence: 1,
            supersetGroup: SECOND_GROUP,
          }),
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
  it('[U1] подходы вхождений не склеиваются в сводке', () => {
    const LATERAL_EXERCISE_ID = 50;
    const PRESS_EXERCISE_ID = 60;
    const session: FinishedWorkoutSession = {
      id: 1,
      workout: {
        id: 1,
        name: 'Тренировка',
        description: null,
        exercises: [
          planItem({
            rowId: 1,
            exerciseId: LATERAL_EXERCISE_ID,
            occurrence: 1,
            supersetGroup: null,
          }),
          planItem({
            rowId: 2,
            exerciseId: LATERAL_EXERCISE_ID,
            occurrence: 2,
            supersetGroup: null,
          }),
          planItem({ rowId: 3, exerciseId: PRESS_EXERCISE_ID, occurrence: 1, supersetGroup: null }),
        ],
      },
      startedAt: COMPLETED_AT,
      finishedAt: COMPLETED_AT,
      results: [...twoSets(1), ...twoSets(2, SECOND_ROW_SET_NUMBERS), ...twoSets(3).slice(0, 1)],
    };

    const { exercises } = toFinishedSessionExercises(session);

    expect(
      exercises.map(({ workoutExerciseId, exerciseId, sets }) => [
        workoutExerciseId,
        exerciseId,
        sets.length,
      ]),
    ).toEqual([
      [1, LATERAL_EXERCISE_ID, FIRST_ROW_SET_COUNT],
      [2, LATERAL_EXERCISE_ID, SECOND_ROW_SET_NUMBERS.length],
      [3, PRESS_EXERCISE_ID, THIRD_ROW_SET_COUNT],
    ]);
  });
});
