import type { SetResult } from '@strive/api-interfaces';
import { formatExerciseCount } from '../../workouts/format-exercise-count';
import {
  LESS_THAN_MINUTE,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
  NO_BREAK_SPACE,
  RUSSIAN_LOCALE,
  SET_DEFAULT_FORM,
  SET_FORMS,
  SUMMARY_SEPARATOR,
  VOLUME_UNIT,
} from './format-session-summary.constants';

const pluralRules = new Intl.PluralRules(RUSSIAN_LOCALE);
const volumeFormat = new Intl.NumberFormat(RUSSIAN_LOCALE);

export function formatSetCount(count: number): string {
  return `${count} ${SET_FORMS[pluralRules.select(count)] ?? SET_DEFAULT_FORM}`;
}

export function formatSessionSummary(results: SetResult[]): string {
  const exerciseCount = new Set(results.map((set) => set.workoutExerciseId)).size;

  return [formatExerciseCount(exerciseCount), formatSetCount(results.length)].join(
    SUMMARY_SEPARATOR,
  );
}

export function formatDuration(startedAt: string, finishedAt: string): string {
  const minutes = Math.floor((Date.parse(finishedAt) - Date.parse(startedAt)) / MS_PER_MINUTE);

  if (minutes <= 0) return LESS_THAN_MINUTE;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const restMinutes = minutes % MINUTES_PER_HOUR;

  return hours === 0 ? `${restMinutes} мин` : `${hours} ч ${restMinutes} мин`;
}

export function formatVolume(volume: number): string {
  return `${volumeFormat.format(volume)}${NO_BREAK_SPACE}${VOLUME_UNIT}`;
}
