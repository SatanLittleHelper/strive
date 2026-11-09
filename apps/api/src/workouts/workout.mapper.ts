import type { Workout, WorkoutSummary } from '@strive/api-interfaces';
import type { WorkoutRow, WorkoutSummaryRow } from './workout.types.js';

export function toWorkoutSummary(row: WorkoutSummaryRow): WorkoutSummary {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    exerciseCount: row._count.workout_exercises,
  };
}

export function toWorkout(row: WorkoutRow): Workout {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    exercises: row.workout_exercises.map((item) => ({
      id: Number(item.id),
      exercise: { id: Number(item.exercise.id), name: item.exercise.name },
      occurrence: item.occurrence,
      sets: item.target_sets,
      reps: item.target_reps,
      weight: item.target_weight === null ? null : Number(item.target_weight),
      supersetGroup: item.superset_group,
    })),
  };
}
