import type { ExerciseHistory, ExerciseHistoryEntry, SetResult } from '@strive/api-interfaces';
import { HISTORY_GROUPS_LIMIT } from '../sessions.constants';
import type { TodayGroupParams } from '../session-view.types';

function sortSetsDescending(sets: SetResult[]): SetResult[] {
  return [...sets].sort((first, second) => second.setNumber - first.setNumber);
}

// «Сегодня» общее для всех строк плана с этим упражнением, новые подходы сверху
export function getTodayGroup({
  exercise,
  exercises,
  results,
}: TodayGroupParams): SetResult[] | null {
  const rowIds = new Set(
    exercises
      .filter((item) => item.exercise.id === exercise.exercise.id)
      .map((item) => item.id),
  );
  const sets = results
    .filter((result) => rowIds.has(result.workoutExerciseId))
    .sort(
      (first, second) =>
        second.completedAt.localeCompare(first.completedAt) || second.setNumber - first.setNumber,
    );

  return sets.length > 0 ? sets : null;
}

export function getHistoryGroups(history: ExerciseHistory | undefined): ExerciseHistoryEntry[] {
  return (history?.entries ?? [])
    .slice(0, HISTORY_GROUPS_LIMIT)
    .map((entry) => ({ ...entry, sets: sortSetsDescending(entry.sets) }));
}
