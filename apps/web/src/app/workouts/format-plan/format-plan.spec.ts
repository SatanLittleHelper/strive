import { describe, expect, it } from 'vitest';
import { formatPlan } from './format-plan';

describe('formatPlan', () => {
  it('показывает диапазон повторов', () => {
    expect(formatPlan({ sets: 3, repsMin: 6, repsMax: 8 })).toBe('3 × 6–8');
  });

  it('не показывает диапазон, если границы совпадают', () => {
    expect(formatPlan({ sets: 2, repsMin: 5, repsMax: 5 })).toBe('2 × 5');
  });
});
