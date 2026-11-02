import type pg from 'pg';

export interface SessionFixture {
  client: pg.Client;
  deviceId: string;
  workoutId?: string;
}

export interface FinishSessionFixture {
  client: pg.Client;
  sessionId: string;
}

export interface SetResultFixture {
  client: pg.Client;
  sessionId: string;
  exerciseId?: string;
  setNumber?: number;
  weight?: number;
  reps?: number;
  rpe?: number | null;
  note?: string | null;
}

export interface WorkoutExerciseFixture {
  client: pg.Client;
  workoutId: string;
  exerciseId: string;
  position?: number;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
}

export interface WorkoutOptions {
  name?: string;
  description?: string | null;
}
