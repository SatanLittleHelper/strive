import type { ExerciseHistory, ExerciseHistoryEntry } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { planExercise, range, setsOf } from '../test-support/session.fixtures';
import { HISTORY_GROUPS_LIMIT } from '../sessions.constants';
import { getHistoryGroups, getTodayGroup } from './history-groups.helpers';

const FIRST_ID = 7;
const SECOND_ID = 8;
const OVER_LIMIT_ENTRIES = HISTORY_GROUPS_LIMIT + 2;
const BASE_DAY_MS = Date.parse('2026-10-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function entryOf({
  sessionId,
  daysAgo,
}: {
  sessionId: number;
  daysAgo: number;
}): ExerciseHistoryEntry {
  return {
    sessionId,
    finishedAt: new Date(BASE_DAY_MS - daysAgo * DAY_MS).toISOString(),
    sets: setsOf({ exerciseId: FIRST_ID, setNumbers: [sessionId] }),
  };
}

describe('Группы истории упражнения', () => {
  it('группа «Сегодня» — подходы текущей сессии только этого упражнения по возрастанию номера', () => {
    const results = [
      ...setsOf({ exerciseId: FIRST_ID, setNumbers: [3, 1] }),
      ...setsOf({ exerciseId: SECOND_ID, setNumbers: [1] }),
    ];

    const group = getTodayGroup({ exercise: planExercise({ id: FIRST_ID }), results });

    expect(group?.map((set) => set.setNumber)).toEqual([1, 3]);
  });

  it('без сохранённых подходов группы «Сегодня» нет', () => {
    const results = setsOf({ exerciseId: SECOND_ID, setNumbers: [1] });

    expect(getTodayGroup({ exercise: planExercise({ id: FIRST_ID }), results })).toBeNull();
  });

  it('записи истории превращаются в группы по дате с сохранением порядка API', () => {
    const entries = [
      entryOf({ sessionId: 1, daysAgo: 0 }),
      entryOf({ sessionId: 2, daysAgo: 7 }),
      entryOf({ sessionId: 3, daysAgo: 14 }),
    ];
    const history: ExerciseHistory = { exerciseId: FIRST_ID, entries };

    const groups = getHistoryGroups(history);

    expect(groups.map((group) => group.finishedAt)).toEqual(
      entries.map((entry) => entry.finishedAt),
    );
    expect(groups.map((group) => group.sets.map((set) => set.setNumber))).toEqual([[1], [2], [3]]);
  });

  it('групп прошлых дат не больше десяти', () => {
    const entries = range(OVER_LIMIT_ENTRIES).map((sessionId) =>
      entryOf({ sessionId, daysAgo: sessionId }),
    );

    const groups = getHistoryGroups({ exerciseId: FIRST_ID, entries });

    expect(groups).toHaveLength(HISTORY_GROUPS_LIMIT);
    expect(groups.map((group) => group.sessionId)).toEqual(range(HISTORY_GROUPS_LIMIT));
  });
});
