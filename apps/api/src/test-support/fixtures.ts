import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  FinishSessionFixture,
  SessionFixture,
  SetResultFixture,
  WorkoutExerciseFixture,
  WorkoutOptions,
} from './fixtures.types.js';

const CATALOG_WORKOUT_ID = 1;
const CATALOG_EXERCISE_ID = 1;

const DEFAULT_SET_NUMBER = 1;
const DEFAULT_WEIGHT = 60;
const DEFAULT_REPS = 8;
const DEFAULT_POSITION = 1;
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_REPS_MIN = 6;
const DEFAULT_REPS_MAX = 8;

async function insertReturningId({
  client,
  sql,
  values,
}: {
  client: pg.Client;
  sql: string;
  values: unknown[];
}): Promise<string> {
  const result = await client.query<{ id: string }>(sql, values);

  return String(result.rows[0]?.id);
}

export function insertExercise(
  client: pg.Client,
  name = `Упражнение ${randomUUID()}`,
): Promise<string> {
  return insertReturningId({
    client,
    sql: `INSERT INTO exercise (name) VALUES ($1) RETURNING id`,
    values: [name],
  });
}

export function insertWorkout(
  client: pg.Client,
  { name = `Тренировка ${randomUUID()}`, description = null }: WorkoutOptions = {},
): Promise<string> {
  return insertReturningId({
    client,
    sql: `INSERT INTO workout (name, description) VALUES ($1, $2) RETURNING id`,
    values: [name, description],
  });
}

export function insertWorkoutExercise({
  client,
  workoutId,
  exerciseId,
  position = DEFAULT_POSITION,
  targetSets = DEFAULT_TARGET_SETS,
  targetRepsMin = DEFAULT_REPS_MIN,
  targetRepsMax = DEFAULT_REPS_MAX,
}: WorkoutExerciseFixture): Promise<pg.QueryResult> {
  return client.query(
    `INSERT INTO workout_exercise
       (workout_id, exercise_id, position, target_sets, target_reps_min, target_reps_max)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [workoutId, exerciseId, position, targetSets, targetRepsMin, targetRepsMax],
  );
}

export function insertSession({ client, deviceId }: SessionFixture): Promise<string> {
  return insertReturningId({
    client,
    sql: `INSERT INTO workout_session (device_id, workout_id) VALUES ($1, $2) RETURNING id`,
    values: [deviceId, CATALOG_WORKOUT_ID],
  });
}

export async function finishSession({ client, sessionId }: FinishSessionFixture): Promise<void> {
  await client.query(`UPDATE workout_session SET finished_at = now() WHERE id = $1`, [sessionId]);
}

export function insertSetResult({
  client,
  sessionId,
  setNumber = DEFAULT_SET_NUMBER,
  weight = DEFAULT_WEIGHT,
  reps = DEFAULT_REPS,
  rpe = null,
}: SetResultFixture): Promise<pg.QueryResult> {
  return client.query(
    `INSERT INTO set_result (session_id, exercise_id, set_number, weight, reps, rpe)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, CATALOG_EXERCISE_ID, setNumber, weight, reps, rpe],
  );
}
