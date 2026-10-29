import type pg from 'pg';

export interface SessionFixture {
  client: pg.Client;
  deviceId: string;
}

export interface FinishSessionFixture {
  client: pg.Client;
  sessionId: string;
}

export interface SetResultFixture {
  client: pg.Client;
  sessionId: string;
  setNumber?: number;
  weight?: number;
  reps?: number;
  rpe?: number | null;
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
