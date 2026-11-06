import { SET_RESULT_LIMITS } from '@strive/api-interfaces';
import { API_URL_PREFIX } from '../api/api.constants';
import type { EditorSet } from './session-view.types';

export const SESSIONS_URL = `${API_URL_PREFIX}/sessions`;
export const SESSION_CONFLICT_STATUS = 409;

export const WEIGHT_MIN = 0;
export const WEIGHT_DECIMAL_PLACES = 2;

export const HISTORY_GROUPS_LIMIT = 10;
export const HISTORY_DATE_FORMAT = 'dd.MM.yyyy';

export const NO_EDITOR_SET: EditorSet = { mode: 'none', setNumber: null };

export const RPE_VALUES: readonly number[] = Array.from(
  { length: SET_RESULT_LIMITS.rpeMax - SET_RESULT_LIMITS.rpeMin + 1 },
  (_, index) => SET_RESULT_LIMITS.rpeMin + index,
);
