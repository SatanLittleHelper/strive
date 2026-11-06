import { describe, expect, it } from 'vitest';
import { formatPlan } from './format-plan';

const EIGHT_REPS_PLAN = { sets: 3, reps: 8 };
const TEN_REPS_PLAN = { sets: 4, reps: 10 };

describe('formatPlan', () => {
  it('показывает подходы и цель повторов без диапазона', () => {
    expect(formatPlan(EIGHT_REPS_PLAN)).toBe('3 × 8');
    expect(formatPlan(TEN_REPS_PLAN)).toBe('4 × 10');
  });
});
