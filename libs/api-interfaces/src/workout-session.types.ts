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

export interface SessionExerciseResults {
  exerciseId: number;
  name: string;
  supersetGroup: number | null;
  sets: SetResult[];
}

export interface SessionSummary {
  id: number;
  workoutId: number;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  exercises: SessionExerciseResults[];
}

export interface SessionListResponse {
  sessions: WorkoutSession[];
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

export interface ExerciseHistoryEntry {
  sessionId: number;
  finishedAt: string;
  sets: SetResult[];
}

export interface ExerciseHistory {
  exerciseId: number;
  entries: ExerciseHistoryEntry[];
}

export interface SessionHistoryResponse {
  exercises: ExerciseHistory[];
}
