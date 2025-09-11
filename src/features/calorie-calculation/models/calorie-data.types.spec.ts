import { isBasicData, isActivityData, Gender, ActivityLevel, Goal } from './calorie-data.types';

describe('Type Guards', () => {
  describe('isBasicData', () => {
    it('should return true for valid BasicData', () => {
      const validBasicData = {
        gender: Gender.MALE,
        age: 25,
        height: 180,
        weight: 75,
      };

      expect(isBasicData(validBasicData)).toBe(true);
    });

    it('should return false for null/undefined/non-object', () => {
      expect(isBasicData(null)).toBe(false);
      expect(isBasicData(undefined)).toBe(false);
      expect(isBasicData('string')).toBe(false);
    });

    it('should return false for incomplete object', () => {
      const incompleteData = { gender: Gender.MALE, age: 25 };
      expect(isBasicData(incompleteData)).toBe(false);
    });
  });

  describe('isActivityData', () => {
    it('should return true for valid ActivityData', () => {
      const validActivityData = {
        activityLevel: ActivityLevel.MODERATELY_ACTIVE,
        goal: Goal.MAINTAIN_WEIGHT,
      };

      expect(isActivityData(validActivityData)).toBe(true);
    });

    it('should return false for null/undefined/non-object', () => {
      expect(isActivityData(null)).toBe(false);
      expect(isActivityData(undefined)).toBe(false);
      expect(isActivityData('string')).toBe(false);
    });

    it('should return false for incomplete object', () => {
      const incompleteData = { activityLevel: ActivityLevel.MODERATELY_ACTIVE };
      expect(isActivityData(incompleteData)).toBe(false);
    });
  });
});
