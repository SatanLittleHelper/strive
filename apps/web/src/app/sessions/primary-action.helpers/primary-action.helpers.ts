import type { PrimaryAction, PrimaryActionParams } from '../session-view.types';

export function getPrimaryAction({
  hasForm,
  isLastExercise,
  sessionDone,
}: PrimaryActionParams): PrimaryAction {
  if (hasForm) return 'save';
  if (sessionDone || isLastExercise) return 'finish';

  return 'next';
}
