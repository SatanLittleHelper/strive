import type { Workout } from './workout.types.js';

export interface SetResult {
  workoutExerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  note: string | null;
  completedAt: string;
}

export interface ShareLink {
  token: string;
  expiresAt: string;
}

export interface WorkoutSession {
  id: number;
  workout: Workout;
  startedAt: string;
  finishedAt: string | null;
  results: SetResult[];
  share?: ShareLink | null;
}

export interface SessionExerciseResults {
  workoutExerciseId: number;
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
  workoutExerciseId: number;
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

export type SharedSetResult = Omit<SetResult, 'note'>;

interface SharedSessionBase {
  workout: Workout;
  startedAt: string;
  results: SharedSetResult[];
}

export interface ActiveSharedSession extends SharedSessionBase {
  finishedAt: null;
}

export interface FinishedSharedSession extends SharedSessionBase {
  finishedAt: string;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
}

export type SharedSessionResponse = ActiveSharedSession | FinishedSharedSession;
