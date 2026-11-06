import type { ExerciseHistory, ExerciseHistoryEntry, SetResult } from '@strive/api-interfaces';
import { HISTORY_GROUPS_LIMIT } from '../sessions.constants';
import type { ExerciseResultsParams } from '../session-view.types';

export function getTodayGroup({ exercise, results }: ExerciseResultsParams): SetResult[] | null {
  const sets = results
    .filter((result) => result.exerciseId === exercise.exercise.id)
    .sort((first, second) => first.setNumber - second.setNumber);

  return sets.length > 0 ? sets : null;
}

export function getHistoryGroups(history: ExerciseHistory | undefined): ExerciseHistoryEntry[] {
  return (history?.entries ?? []).slice(0, HISTORY_GROUPS_LIMIT);
}
