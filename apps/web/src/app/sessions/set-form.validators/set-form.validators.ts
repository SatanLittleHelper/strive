import {
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { WEIGHT_DECIMAL_PLACES, WEIGHT_MIN } from '../sessions.constants';

const integer: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const { value } = control;

  return typeof value === 'number' && !Number.isInteger(value) ? { integer: true } : null;
};

function maxDecimalPlaces(places: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const { value } = control;
    if (typeof value !== 'number') return null;

    return Number(value.toFixed(places)) === value ? null : { maxDecimalPlaces: { places } };
  };
}

export const WEIGHT_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.min(WEIGHT_MIN),
  Validators.max(SET_RESULT_LIMITS.weightMax),
  maxDecimalPlaces(WEIGHT_DECIMAL_PLACES),
];

export const REPS_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.min(SET_RESULT_LIMITS.repsMin),
  Validators.max(SET_RESULT_LIMITS.repsMax),
  integer,
];

export const RPE_VALIDATORS: ValidatorFn[] = [
  Validators.min(SET_RESULT_LIMITS.rpeMin),
  Validators.max(SET_RESULT_LIMITS.rpeMax),
  integer,
];

export const NOTE_VALIDATORS: ValidatorFn[] = [
  Validators.maxLength(SET_RESULT_LIMITS.noteMaxLength),
];
