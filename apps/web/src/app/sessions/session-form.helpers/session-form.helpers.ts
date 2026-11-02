import {
  DEFAULT_RPE,
  SET_RESULT_LIMITS,
  type SetResult,
  type WorkoutSession,
} from '@strive/api-interfaces';
import type {
  ActiveSetParams,
  RawSetInput,
  SetDefaultsParams,
  SetFormValues,
  SetInputValidation,
  SwipeStepParams,
} from '../session-form.types';

export function validateSetInput(raw: RawSetInput): SetInputValidation {
  const weightText = raw.weight.trim().replace(',', '.');
  const weight = Number(weightText);
  const reps = Number(raw.reps);
  const rpe = raw.rpe.trim() === '' ? null : Number(raw.rpe);

  if (
    !/^\d+(\.\d{1,2})?$/.test(weightText) ||
    !Number.isFinite(weight) ||
    weight < 0 ||
    weight > SET_RESULT_LIMITS.weightMax
  ) {
    return {
      ok: false,
      error: `Вес: от 0 до ${SET_RESULT_LIMITS.weightMax} кг, не более двух знаков после запятой`,
    };
  }
  if (
    !Number.isInteger(reps) ||
    reps < SET_RESULT_LIMITS.repsMin ||
    reps > SET_RESULT_LIMITS.repsMax
  ) {
    return {
      ok: false,
      error: `Повторы: целое число от ${SET_RESULT_LIMITS.repsMin} до ${SET_RESULT_LIMITS.repsMax}`,
    };
  }
  if (
    rpe !== null &&
    (!Number.isInteger(rpe) || rpe < SET_RESULT_LIMITS.rpeMin || rpe > SET_RESULT_LIMITS.rpeMax)
  ) {
    return {
      ok: false,
      error: `RPE: целое число от ${SET_RESULT_LIMITS.rpeMin} до ${SET_RESULT_LIMITS.rpeMax}`,
    };
  }
  if (raw.note.length > SET_RESULT_LIMITS.noteMaxLength) {
    return { ok: false, error: `Заметка: не более ${SET_RESULT_LIMITS.noteMaxLength} символов` };
  }

  return { ok: true, value: { weight, reps, rpe, note: raw.note.trim() || null } };
}

export function countCompletedSets(session: WorkoutSession): number {
  return session.results.length;
}

export function findResult(
  session: WorkoutSession,
  exerciseId: number,
  setNumber: number,
): SetResult | undefined {
  return session.results.find(
    (result) => result.exerciseId === exerciseId && result.setNumber === setNumber,
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
    .filter((result) => result.exerciseId === exercise.exercise.id && result.setNumber < setNumber)
    .reduce<SetResult | undefined>(
      (latest, result) => (latest && latest.setNumber > result.setNumber ? latest : result),
      undefined,
    );
  const historical = history?.entries[0]?.sets.find((set) => set.setNumber === setNumber);

  return {
    weight: previous?.weight ?? exercise.weight ?? historical?.weight ?? null,
    reps: previous?.reps ?? exercise.repsMin,
    rpe: previous?.rpe ?? DEFAULT_RPE,
    note: '',
  };
}

export function getFirstUnfinishedExerciseIndex(session: WorkoutSession): number {
  const { exercises } = session.workout;
  const index = exercises.findIndex(
    (item) =>
      session.results.filter((result) => result.exerciseId === item.exercise.id).length < item.sets,
  );

  return index === -1 ? Math.max(exercises.length - 1, 0) : index;
}

export function getActiveSetNumber({ exercise, results }: ActiveSetParams): number | null {
  const saved = new Set(
    results
      .filter((result) => result.exerciseId === exercise.exercise.id)
      .map((result) => result.setNumber),
  );

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
