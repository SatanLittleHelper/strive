import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  FinishSessionFixture,
  SessionFixture,
  SetResultFixture,
  WorkoutExerciseFixture,
  WorkoutOptions,
} from './fixtures.types.js';

const DEFAULT_SET_NUMBER = 1;
const DEFAULT_WEIGHT = 60;
const DEFAULT_REPS = 8;
const DEFAULT_POSITION = 1;
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 8;

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
  targetReps = DEFAULT_TARGET_REPS,
  targetWeight = null,
  supersetGroup = null,
}: WorkoutExerciseFixture): Promise<pg.QueryResult> {
  return client.query(
    `INSERT INTO workout_exercise
       (workout_id, exercise_id, position, target_sets, target_reps, target_weight, superset_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [workoutId, exerciseId, position, targetSets, targetReps, targetWeight, supersetGroup],
  );
}

export async function insertSession({
  client,
  deviceId,
  workoutId,
}: SessionFixture): Promise<string> {
  const ownerWorkoutId = workoutId ?? (await insertWorkout(client));

  return insertReturningId({
    client,
    sql: `INSERT INTO workout_session (device_id, workout_id) VALUES ($1, $2) RETURNING id`,
    values: [deviceId, ownerWorkoutId],
  });
}

export async function finishSession({
  client,
  sessionId,
  finishedAt = null,
}: FinishSessionFixture): Promise<void> {
  await client.query(
    `UPDATE workout_session SET finished_at = COALESCE($2::timestamptz, now()) WHERE id = $1`,
    [sessionId, finishedAt],
  );
}

export async function insertSetResult({
  client,
  sessionId,
  exerciseId,
  setNumber = DEFAULT_SET_NUMBER,
  weight = DEFAULT_WEIGHT,
  reps = DEFAULT_REPS,
  rpe = null,
  note = null,
}: SetResultFixture): Promise<pg.QueryResult> {
  const resultExerciseId = exerciseId ?? (await insertExercise(client));

  return client.query(
    `INSERT INTO set_result (session_id, exercise_id, set_number, weight, reps, rpe, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sessionId, resultExerciseId, setNumber, weight, reps, rpe, note],
  );
}
