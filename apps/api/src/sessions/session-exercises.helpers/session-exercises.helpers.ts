import type { SessionExerciseResults } from '@strive/api-interfaces';
import type { FinishedSessionExercises, FinishedWorkoutSession } from '../session.types.js';

// results отсортированы по workout_exercise_id и set_number; фильтр сохраняет порядок подходов.
function groupExercises(session: FinishedWorkoutSession): SessionExerciseResults[] {
  return session.workout.exercises.flatMap((item) => {
    const sets = session.results.filter((set) => set.workoutExerciseId === item.id);

    if (sets.length === 0) return [];

    return [
      {
        workoutExerciseId: item.id,
        exerciseId: item.exercise.id,
        name: item.exercise.name,
        supersetGroup: item.supersetGroup,
        sets,
      },
    ];
  });
}

export function toFinishedSessionExercises(
  session: FinishedWorkoutSession,
): FinishedSessionExercises {
  return {
    id: session.id,
    workout: { id: session.workout.id, name: session.workout.name },
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exercises: groupExercises(session),
  };
}
