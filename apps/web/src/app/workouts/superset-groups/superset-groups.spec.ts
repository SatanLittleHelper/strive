import type { WorkoutExercise } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import { groupSupersets } from './superset-groups';

const item = (id: number, supersetGroup: number | null) =>
  ({ id, supersetGroup }) as WorkoutExercise;

describe('groupSupersets', () => {
  it('собирает соседние упражнения одной группы в суперсет', () => {
    const rows = groupSupersets([item(1, null), item(2, 1), item(3, 1), item(4, null)]);

    expect(rows.map((row) => [row.superset, row.items.map((entry) => entry.id)])).toEqual([
      [false, [1]],
      [true, [2, 3]],
      [false, [4]],
    ]);
  });

  it('разделяет соседние суперсеты разных групп', () => {
    const rows = groupSupersets([item(1, 1), item(2, 1), item(3, 2), item(4, 2)]);

    expect(rows.map((row) => row.items.length)).toEqual([2, 2]);
    expect(rows.every((row) => row.superset)).toBe(true);
  });

  it('одиночное упражнение с группой не считается суперсетом', () => {
    expect(groupSupersets([item(1, 1), item(2, null)]).map((row) => row.superset)).toEqual([
      false,
      false,
    ]);
  });
});
