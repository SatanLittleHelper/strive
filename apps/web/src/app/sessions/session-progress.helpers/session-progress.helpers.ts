import { SET_RESULT_LIMITS, type WorkoutSession } from '@strive/api-interfaces';
import type { AdvanceParams, ExerciseResultsParams } from '../session-view.types';

export function getSavedSetNumbers({ exercise, results }: ExerciseResultsParams): Set<number> {
  return new Set(
    results
      .filter((result) => result.exerciseId === exercise.exercise.id)
      .map((result) => result.setNumber),
  );
}

export function countExerciseSets(params: ExerciseResultsParams): number {
  return getSavedSetNumbers(params).size;
}

export function getLastSetNumber(params: ExerciseResultsParams): number {
  return Math.max(0, ...getSavedSetNumbers(params));
}

export function getRingMax(params: ExerciseResultsParams): number {
  return Math.max(params.exercise.sets, countExerciseSets(params));
}

function hasAllPlannedSets({ saved, planned }: { saved: Set<number>; planned: number }): boolean {
  return Array.from({ length: planned }, (_, index) => index + 1).every((setNumber) =>
    saved.has(setNumber),
  );
}

export function isExerciseDone(params: ExerciseResultsParams): boolean {
  return hasAllPlannedSets({ saved: getSavedSetNumbers(params), planned: params.exercise.sets });
}

export function isSessionDone(session: WorkoutSession): boolean {
  return session.workout.exercises.every((exercise) =>
    isExerciseDone({ exercise, results: session.results }),
  );
}

export function canAddSet(params: ExerciseResultsParams): boolean {
  return getLastSetNumber(params) < SET_RESULT_LIMITS.setNumberMax;
}

export function shouldAdvanceAfterSave({
  exercise,
  resultsBefore,
  savedSetNumber,
  isLastExercise,
}: AdvanceParams): boolean {
  if (isLastExercise) return false;

  const before = getSavedSetNumbers({ exercise, results: resultsBefore });
  const after = new Set([...before, savedSetNumber]);

  return (
    !hasAllPlannedSets({ saved: before, planned: exercise.sets }) &&
    hasAllPlannedSets({ saved: after, planned: exercise.sets })
  );
}
