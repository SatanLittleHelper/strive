import { FormControl, type ValidatorFn } from '@angular/forms';
import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { describe, expect, it } from 'vitest';
import {
  NOTE_VALIDATORS,
  REPS_VALIDATORS,
  RPE_VALIDATORS,
  WEIGHT_VALIDATORS,
} from './set-form.validators';

const { weightMax, repsMin, repsMax, rpeMin, rpeMax, noteMaxLength } = SET_RESULT_LIMITS;
const FRACTIONAL = 1.5;
const WEIGHT_THREE_DECIMALS = 60.125;
const WEIGHT_TWO_DECIMALS = 60.25;

const errorsOf = <T>(value: T, validators: ValidatorFn[]) =>
  new FormControl<T>(value, validators).errors;

describe('Валидаторы полей подхода', () => {
  describe('вес', () => {
    it('U1 · пустой вес — обязательное поле', () => {
      expect(errorsOf<number | null>(null, WEIGHT_VALIDATORS)).toHaveProperty('required');
    });

    it('U2 · вес ниже нуля отклоняется', () => {
      expect(errorsOf(-1, WEIGHT_VALIDATORS)).toHaveProperty('min');
    });

    it('U3 · вес выше максимума отклоняется', () => {
      expect(errorsOf(weightMax + 1, WEIGHT_VALIDATORS)).toHaveProperty('max');
    });

    it('U4 · вес с тремя знаками после запятой отклоняется', () => {
      expect(errorsOf(WEIGHT_THREE_DECIMALS, WEIGHT_VALIDATORS)).toHaveProperty('maxDecimalPlaces');
    });

    it.each([0, WEIGHT_TWO_DECIMALS, weightMax])('U5 · допустимый вес %s принимается', (weight) => {
      expect(errorsOf(weight, WEIGHT_VALIDATORS)).toBeNull();
    });
  });

  describe('повторы', () => {
    it('U6 · пустые повторы — обязательное поле', () => {
      expect(errorsOf<number | null>(null, REPS_VALIDATORS)).toHaveProperty('required');
    });

    it('U7 · повторы ниже минимума отклоняются', () => {
      expect(errorsOf(repsMin - 1, REPS_VALIDATORS)).toHaveProperty('min');
    });

    it('U8 · повторы выше максимума отклоняются', () => {
      expect(errorsOf(repsMax + 1, REPS_VALIDATORS)).toHaveProperty('max');
    });

    it('U9 · дробные повторы отклоняются', () => {
      expect(errorsOf(FRACTIONAL, REPS_VALIDATORS)).toHaveProperty('integer');
    });

    it.each([repsMin, repsMax])('U10 · допустимые повторы %s принимаются', (reps) => {
      expect(errorsOf(reps, REPS_VALIDATORS)).toBeNull();
    });
  });

  describe('RPE', () => {
    it('U11 · RPE ниже минимума отклоняется', () => {
      expect(errorsOf(rpeMin - 1, RPE_VALIDATORS)).toHaveProperty('min');
    });

    it('U12 · RPE выше максимума отклоняется', () => {
      expect(errorsOf(rpeMax + 1, RPE_VALIDATORS)).toHaveProperty('max');
    });

    it('U13 · дробный RPE отклоняется', () => {
      expect(errorsOf(FRACTIONAL, RPE_VALIDATORS)).toHaveProperty('integer');
    });

    it('U14 · пустой RPE принимается', () => {
      expect(errorsOf<number | null>(null, RPE_VALIDATORS)).toBeNull();
    });

    it.each([rpeMin, rpeMax])('U15 · граничное значение RPE %s принимается', (rpe) => {
      expect(errorsOf(rpe, RPE_VALIDATORS)).toBeNull();
    });
  });

  describe('заметка', () => {
    it('U16 · слишком длинная заметка отклоняется', () => {
      expect(errorsOf('x'.repeat(noteMaxLength + 1), NOTE_VALIDATORS)).toHaveProperty('maxlength');
    });

    it('U17 · пустая заметка принимается', () => {
      expect(errorsOf('', NOTE_VALIDATORS)).toBeNull();
    });

    it('U18 · заметка предельной длины принимается', () => {
      expect(errorsOf('x'.repeat(noteMaxLength), NOTE_VALIDATORS)).toBeNull();
    });
  });
});
