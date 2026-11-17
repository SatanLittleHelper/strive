import type { ExerciseHistory, ExerciseHistoryEntry, SetResult } from '@strive/api-interfaces';
import { HISTORY_GROUPS_LIMIT } from '../sessions.constants';
import type { ExerciseResultsParams } from '../session-view.types';

function sortSetsDescending(sets: SetResult[]): SetResult[] {
  return [...sets].sort((first, second) => second.setNumber - first.setNumber);
}

export function getTodayGroup({ exercise, results }: ExerciseResultsParams): SetResult[] | null {
  const sets = sortSetsDescending(
    results.filter((result) => result.workoutExerciseId === exercise.id),
  );

  return sets.length > 0 ? sets : null;
}

export function getHistoryGroups(history: ExerciseHistory | undefined): ExerciseHistoryEntry[] {
  return (history?.entries ?? [])
    .slice(0, HISTORY_GROUPS_LIMIT)
    .map((entry) => ({ ...entry, sets: sortSetsDescending(entry.sets) }));
}
