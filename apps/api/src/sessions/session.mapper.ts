import type { WorkoutSession } from '@strive/api-interfaces';
import type { SessionMapping } from './session.types.js';

export function toSession({ row, workout }: SessionMapping): WorkoutSession {
  return {
    id: Number(row.id),
    workout,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
    results: row.set_results.map((result) => ({
      exerciseId: Number(result.exercise_id),
      setNumber: result.set_number,
      weight: Number(result.weight),
      reps: result.reps,
      rpe: result.rpe,
      note: result.note,
      completedAt: result.completed_at.toISOString(),
    })),
  };
}
