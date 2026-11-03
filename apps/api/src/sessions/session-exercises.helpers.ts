import type { SessionExerciseResults } from '@strive/api-interfaces';
import type { FinishedSessionExercises, FinishedWorkoutSession } from './session.types.js';

// results уже отсортированы по exercise_id и set_number (SESSION_INCLUDE), поэтому фильтр сохраняет порядок подходов
function groupExercises(session: FinishedWorkoutSession): SessionExerciseResults[] {
  return session.workout.exercises.flatMap(({ exercise }) => {
    const sets = session.results.filter((set) => set.exerciseId === exercise.id);

    if (sets.length === 0) return [];

    return [{ exerciseId: exercise.id, name: exercise.name, sets }];
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
