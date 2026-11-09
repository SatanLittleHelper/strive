import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const SETS_IN_GROUP = 2;
const SETS_SINGLE = 1;
const REPS = 8;
const GROUP = 1;

export interface SupersetWorkout {
  workoutName: string;
  exerciseNames: [string, string, string];
  cleanup: () => Promise<void>;
}

export async function createSupersetWorkout(): Promise<SupersetWorkout> {
  const client = new pg.Client({ connectionString: process.env['DATABASE_URL'] });
  await client.connect();
  await client.query('BEGIN');
  const prepared = await (async () => {
    try {
      const suffix = randomUUID();
      const workoutName = `Суперсет E2E ${suffix}`;
      const exerciseNames: SupersetWorkout['exerciseNames'] = [
        `A1 ${suffix}`,
        `A2 ${suffix}`,
        `B ${suffix}`,
      ];
      const workout = await client.query<{ id: string }>(
        'INSERT INTO workout (name) VALUES ($1) RETURNING id',
        [workoutName],
      );
      const workoutId = workout.rows[0]?.id;
      const plan = [
        { name: exerciseNames[0], sets: SETS_IN_GROUP, group: GROUP },
        { name: exerciseNames[1], sets: SETS_IN_GROUP, group: GROUP },
        { name: exerciseNames[2], sets: SETS_SINGLE, group: null },
      ];
      for (const [index, item] of plan.entries()) {
        const exercise = await client.query<{ id: string }>(
          'INSERT INTO exercise (name) VALUES ($1) RETURNING id',
          [item.name],
        );
        await client.query(
          `INSERT INTO workout_exercise
             (workout_id, exercise_id, position, target_sets, target_reps, superset_group)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [workoutId, exercise.rows[0]?.id, index + 1, item.sets, REPS, item.group],
        );
      }
      await client.query('COMMIT');

      return { workoutName, exerciseNames, workoutId };
    } catch (error) {
      await client.query('ROLLBACK');
      await client.end();
      throw error;
    }
  })();
  const { workoutName, exerciseNames, workoutId } = prepared;

  return {
    workoutName,
    exerciseNames,
    cleanup: async () => {
      await client.query('DELETE FROM workout_session WHERE workout_id = $1', [workoutId]);
      await client.query('DELETE FROM workout WHERE id = $1', [workoutId]);
      await client.query('DELETE FROM exercise WHERE name = ANY($1)', [exerciseNames]);
      await client.end();
    },
  };
}
