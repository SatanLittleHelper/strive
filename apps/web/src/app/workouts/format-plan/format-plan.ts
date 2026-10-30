import type { WorkoutExercise } from '@strive/api-interfaces';

export function formatPlan({
  sets,
  repsMin,
  repsMax,
}: Pick<WorkoutExercise, 'sets' | 'repsMin' | 'repsMax'>): string {
  const reps = repsMin === repsMax ? `${repsMin}` : `${repsMin}–${repsMax}`;

  return `${sets} × ${reps}`;
}
