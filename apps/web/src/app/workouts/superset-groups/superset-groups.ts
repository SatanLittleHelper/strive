import type { WorkoutExercise } from '@strive/api-interfaces';
import type { ExerciseRow } from './superset-groups.types';

// соседние упражнения с одной группой образуют суперсет; одиночное — обычная строка
export function groupSupersets(exercises: WorkoutExercise[]): ExerciseRow[] {
  return exercises.reduce<ExerciseRow[]>((rows, item) => {
    const last = rows.at(-1);
    const joinsLast =
      item.supersetGroup !== null && last?.items.at(-1)?.supersetGroup === item.supersetGroup;
    if (last && joinsLast) {
      last.items.push(item);
      last.superset = true;
    } else {
      rows.push({ items: [item], superset: false });
    }

    return rows;
  }, []);
}
