import {
  DEFAULT_RPE,
  type SaveSetResultRequest,
  type SetResult,
  type WorkoutSession,
} from '@strive/api-interfaces';
import type {
  ActiveSetParams,
  SetDefaultsParams,
  SetFormValues,
  SwipeStepParams,
  ValidSetFormValues,
} from '../session-form.types';
import {
  countExerciseSets,
  getSavedSetNumbers,
  getSupersetIndexes,
  isExerciseDone,
} from '../session-progress.helpers';

export function toSaveSetRequest({
  weight,
  reps,
  rpe,
  note,
}: ValidSetFormValues): SaveSetResultRequest {
  return { weight, reps, rpe, note: note.trim() || null };
}

export function countCompletedSets(session: WorkoutSession): number {
  return session.results.length;
}

export function findResult({
  session,
  workoutExerciseId,
  setNumber,
}: {
  session: WorkoutSession;
  workoutExerciseId: number;
  setNumber: number;
}): SetResult | undefined {
  return session.results.find(
    (result) => result.workoutExerciseId === workoutExerciseId && result.setNumber === setNumber,
  );
}

export function toFormValues(result: SetResult): SetFormValues {
  return { weight: result.weight, reps: result.reps, rpe: result.rpe, note: result.note ?? '' };
}

export function isSameFormValues(first: SetFormValues, second: SetFormValues): boolean {
  return (
    first.weight === second.weight &&
    first.reps === second.reps &&
    first.rpe === second.rpe &&
    first.note === second.note
  );
}

export function getSetDefaults({
  exercise,
  setNumber,
  results,
  history,
}: SetDefaultsParams): SetFormValues {
  const previous = results
    .filter((result) => result.workoutExerciseId === exercise.id && result.setNumber < setNumber)
    .reduce<SetResult | undefined>(
      (latest, result) => (latest && latest.setNumber > result.setNumber ? latest : result),
      undefined,
    );
  const historical = history?.entries[0]?.sets.find((set) => set.setNumber === setNumber);

  return {
    weight: previous?.weight ?? exercise.weight ?? historical?.weight ?? null,
    reps: previous?.reps ?? exercise.reps,
    rpe: previous?.rpe ?? DEFAULT_RPE,
    note: '',
  };
}

export function getFirstUnfinishedExerciseIndex(session: WorkoutSession): number {
  const { exercises } = session.workout;
  const index = exercises.findIndex(
    (exercise) => !isExerciseDone({ exercise, results: session.results }),
  );
  if (index === -1) return Math.max(exercises.length - 1, 0);

  const unfinishedMembers = getSupersetIndexes({ exercises, index }).filter((position) => {
    const exercise = exercises[position];

    return exercise !== undefined && !isExerciseDone({ exercise, results: session.results });
  });

  // внутри суперсета следующий шаг — упражнение с наименьшим числом подходов, при равенстве первое
  return unfinishedMembers.reduce((best, position) => {
    const exercise = exercises[position];
    const bestExercise = exercises[best];
    if (!exercise || !bestExercise) return best;

    return countExerciseSets({ exercise, results: session.results }) <
      countExerciseSets({ exercise: bestExercise, results: session.results })
      ? position
      : best;
  }, index);
}

export function getActiveSetNumber({ exercise, results }: ActiveSetParams): number | null {
  const saved = getSavedSetNumbers({ exercise, results });

  return (
    Array.from({ length: exercise.sets }, (_, index) => index + 1).find(
      (setNumber) => !saved.has(setNumber),
    ) ?? null
  );
}

export function getSwipeStep({ index, count, direction }: SwipeStepParams): number {
  if (direction === 'left') return Math.min(index + 1, Math.max(count - 1, 0));
  if (direction === 'right') return Math.max(index - 1, 0);

  return index;
}
