import { SET_RESULT_LIMITS, type SetResult, type WorkoutSession } from '@strive/api-interfaces';
import type { RawSetInput, SetInputValidation } from '../session-form.types';

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
