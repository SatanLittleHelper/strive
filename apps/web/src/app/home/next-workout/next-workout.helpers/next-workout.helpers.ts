import type { WorkoutSummary } from '@strive/api-interfaces';
import { isFinished, type NextWorkoutParams } from './next-workout.types';

export function getNextWorkout({ workouts, finished }: NextWorkoutParams): WorkoutSummary | null {
  const [first] = workouts;
  if (first === undefined) return null;

  const lastWorkoutId = finished
    .filter(isFinished)
    .sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt))[0]?.workout.id;
  const lastIndex = workouts.findIndex((workout) => workout.id === lastWorkoutId);

  // не найдена или последняя в каталоге: lastIndex + 1 выходит за границы и даёт первую
  return workouts[lastIndex + 1] ?? first;
}
