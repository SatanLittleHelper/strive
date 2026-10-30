import { describe, expect, it } from 'vitest';
import { formatExerciseCount } from './format-exercise-count';

describe('formatExerciseCount', () => {
  it.each([
    [0, '0 упражнений'],
    [1, '1 упражнение'],
    [2, '2 упражнения'],
    [5, '5 упражнений'],
    [11, '11 упражнений'],
    [21, '21 упражнение'],
  ])('склоняет число упражнений %i', (count, expected) => {
    expect(formatExerciseCount(count)).toBe(expected);
  });
});
