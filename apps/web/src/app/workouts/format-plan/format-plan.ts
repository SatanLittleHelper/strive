import type { WorkoutExercise } from '@strive/api-interfaces';

export function formatPlan({ sets, reps }: Pick<WorkoutExercise, 'sets' | 'reps'>): string {
  return `${sets} × ${reps}`;
}
