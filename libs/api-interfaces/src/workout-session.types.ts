import type { Workout } from './workout.types.js';

export interface SetResult {
  exerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  note: string | null;
  completedAt: string;
}

export interface WorkoutSession {
  id: number;
  workout: Workout;
  startedAt: string;
  finishedAt: string | null;
  results: SetResult[];
}

export interface ActiveSessionResponse {
  session: WorkoutSession | null;
}

export interface StartSessionRequest {
  workoutId: number;
}

export interface SessionIdRequest {
  id: number;
}

export interface SetResultParamsRequest extends SessionIdRequest {
  exerciseId: number;
  setNumber: number;
}

export interface SaveSetResultRequest {
  weight: number;
  reps: number;
  rpe?: number | null;
  note?: string | null;
}
