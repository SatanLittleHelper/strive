import { type SetResult, type WorkoutExercise, type WorkoutSession } from '@strive/api-interfaces';
import type {
  AdvanceParams,
  AdvanceTargetParams,
  ExerciseResultsParams,
} from '../session-view.types';

export function getSavedSetNumbers({ exercise, results }: ExerciseResultsParams): Set<number> {
  return new Set(
    results
      .filter((result) => result.workoutExerciseId === exercise.id)
      .map((result) => result.setNumber),
  );
}

export function countExerciseSets(params: ExerciseResultsParams): number {
  return getSavedSetNumbers(params).size;
}

export function getRingMax(params: ExerciseResultsParams): number {
  return Math.max(params.exercise.sets, countExerciseSets(params));
}

// подходы сверх плана не засчитываются: считаются только номера 1…planned
function countPlannedSaved({ saved, planned }: { saved: Set<number>; planned: number }): number {
  return Array.from({ length: planned }, (_, index) => index + 1).filter((setNumber) =>
    saved.has(setNumber),
  ).length;
}

function hasAllPlannedSets(params: { saved: Set<number>; planned: number }): boolean {
  return countPlannedSaved(params) === params.planned;
}

export function isExerciseDone(params: ExerciseResultsParams): boolean {
  return hasAllPlannedSets({ saved: getSavedSetNumbers(params), planned: params.exercise.sets });
}

export function isSessionDone(session: WorkoutSession): boolean {
  return session.workout.exercises.every((exercise) =>
    isExerciseDone({ exercise, results: session.results }),
  );
}

export function getExerciseCompletion({ exercise, results }: ExerciseResultsParams): number {
  const planned = exercise.sets;

  return countPlannedSaved({ saved: getSavedSetNumbers({ exercise, results }), planned }) / planned;
}

export function getSessionCompletion(session: WorkoutSession): number {
  return session.workout.exercises.reduce(
    (total, exercise) => total + getExerciseCompletion({ exercise, results: session.results }),
    0,
  );
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

export function getSupersetIndexes({
  exercises,
  index,
}: {
  exercises: WorkoutExercise[];
  index: number;
}): number[] {
  const group = exercises[index]?.supersetGroup ?? null;
  if (group === null) return [];

  return exercises.flatMap((exercise, position) =>
    exercise.supersetGroup === group ? [position] : [],
  );
}

function isPlanDoneWith({
  exercise,
  results,
  extraSetNumber,
}: {
  exercise: WorkoutExercise;
  results: SetResult[];
  extraSetNumber: number | null;
}): boolean {
  const saved = getSavedSetNumbers({ exercise, results });
  if (extraSetNumber !== null) saved.add(extraSetNumber);

  return hasAllPlannedSets({ saved, planned: exercise.sets });
}

// Индекс упражнения, на которое переходим после сохранения подхода, либо null, если остаёмся
export function getAdvanceTarget({
  exercises,
  resultsBefore,
  currentIndex,
  savedSetNumber,
}: AdvanceTargetParams): number | null {
  const exercise = exercises[currentIndex];
  if (!exercise) return null;

  const members = getSupersetIndexes({ exercises, index: currentIndex });
  if (members.length === 0) {
    const isLastExercise = currentIndex >= exercises.length - 1;

    return shouldAdvanceAfterSave({ exercise, resultsBefore, savedSetNumber, isLastExercise })
      ? currentIndex + 1
      : null;
  }

  const savedBefore = getSavedSetNumbers({ exercise, results: resultsBefore });
  const isNewPlannedSet = !savedBefore.has(savedSetNumber) && savedSetNumber <= exercise.sets;
  if (!isNewPlannedSet) return null;

  const ownPosition = members.indexOf(currentIndex);
  const others = [...members.slice(ownPosition + 1), ...members.slice(0, ownPosition)];
  const next = others.find((index) => {
    const member = exercises[index];

    return (
      member !== undefined &&
      !isPlanDoneWith({ exercise: member, results: resultsBefore, extraSetNumber: null })
    );
  });
  if (next !== undefined) return next;

  const ownDone = isPlanDoneWith({
    exercise,
    results: resultsBefore,
    extraSetNumber: savedSetNumber,
  });
  if (!ownDone) return null;

  const afterGroup = (members.at(-1) ?? currentIndex) + 1;

  return afterGroup < exercises.length ? afterGroup : null;
}
