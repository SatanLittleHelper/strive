import {
  generateSelectOptions,
  stringifySelectOption,
  identityMatcherSelectOption,
} from '@/shared';
import type { SelectOption } from '../types';

describe('Select Options Utils', () => {
  describe('generateSelectOptions', () => {
    it('should generate options from complex object', () => {
      const sourceObject = {
        OPTION_1: { value: 'option1', label: 'Option 1', description: 'First option' },
        OPTION_2: { value: 'option2', label: 'Option 2' },
      };

      const result = generateSelectOptions(sourceObject);

      expect(result).toEqual([
        { value: 'option1', label: 'Option 1', description: 'First option' },
        { value: 'option2', label: 'Option 2' },
      ]);
    });
  });

  describe('stringifySelectOption', () => {
    it('should format option with description', () => {
      const option: SelectOption = {
        value: 'test',
        label: 'Test Label',
        description: 'Test Description',
      };

      const result = stringifySelectOption(option);

      expect(result).toBe('Test Label (Test Description)');
    });

    it('should format option without description', () => {
      const option: SelectOption = {
        value: 'test',
        label: 'Test Label',
      };

      const result = stringifySelectOption(option);

      expect(result).toBe('Test Label');
    });
  });

  describe('identityMatcherSelectOption', () => {
    it('should return true for options with same value', () => {
      const option1: SelectOption = { value: 'test', label: 'Test 1' };
      const option2: SelectOption = { value: 'test', label: 'Test 2' };

      const result = identityMatcherSelectOption(option1, option2);

      expect(result).toBeTrue();
    });

    it('should return false for options with different values', () => {
      const option1: SelectOption = { value: 'test1', label: 'Test 1' };
      const option2: SelectOption = { value: 'test2', label: 'Test 2' };

      const result = identityMatcherSelectOption(option1, option2);

      expect(result).toBeFalse();
    });
  });
});
