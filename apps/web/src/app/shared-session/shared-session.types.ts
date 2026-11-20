import type { Signal } from '@angular/core';
import type { SetResult, SharedSessionResponse, WorkoutSession } from '@strive/api-interfaces';

export type SharedSessionStatus = 'loading' | 'ready' | 'invalid';

export interface SharedState {
  session: SharedSessionResponse | null;
  status: SharedSessionStatus;
  offline: boolean;
}

export interface SharedSessionWatch {
  session: Signal<SharedSessionResponse | null>;
  status: Signal<SharedSessionStatus>;
  offline: Signal<boolean>;
}

export type PollResult =
  { type: 'session'; session: SharedSessionResponse } | { type: 'invalid' } | { type: 'offline' };

export type SharedExerciseStatus = 'done' | 'current' | 'todo' | 'skipped';

export interface SharedExerciseView {
  id: number;
  name: string;
  status: SharedExerciseStatus;
  doneSets: number;
  plannedSets: number;
  // подходы раскрываются только у текущего упражнения
  sets: Array<Omit<SetResult, 'note'>>;
}

export interface SharedRowView {
  superset: boolean;
  items: SharedExerciseView[];
}

export interface SharedCounters {
  remainingSets: number;
  totalSets: number;
  remainingExercises: number;
  totalExercises: number;
}

export interface SharedSummaryView {
  startedAt: string;
  finishedAt: string;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
}

export interface SharedView {
  progressSession: WorkoutSession;
  currentId: number | null;
  counters: SharedCounters;
  rows: SharedRowView[];
  summary: SharedSummaryView | null;
}
