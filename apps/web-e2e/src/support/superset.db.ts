import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const SETS_IN_GROUP = 2;
const REPS = 8;

export interface SupersetWorkout {
  workoutName: string;
  exerciseNames: { block: string; lateral: string; french: string };
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
      const exerciseNames = {
        block: `Блок ${suffix}`,
        lateral: `Махи ${suffix}`,
        french: `Французский ${suffix}`,
      };
      const workout = await client.query<{ id: string }>(
        'INSERT INTO workout (name) VALUES ($1) RETURNING id',
        [workoutName],
      );
      const workoutId = workout.rows[0]?.id;
      const exerciseIds: Record<string, string> = {};
      for (const [key, name] of Object.entries(exerciseNames)) {
        const exercise = await client.query<{ id: string }>(
          'INSERT INTO exercise (name) VALUES ($1) RETURNING id',
          [name],
        );
        const id = exercise.rows[0]?.id;
        if (!id) throw new Error('Упражнение не создано');
        exerciseIds[key] = id;
      }
      const plan = [
        { key: 'block', occurrence: 1, group: 1 },
        { key: 'lateral', occurrence: 1, group: 1 },
        { key: 'lateral', occurrence: 2, group: 2 },
        { key: 'french', occurrence: 1, group: 2 },
      ];
      for (const item of plan) {
        await client.query(
          `INSERT INTO workout_exercise (workout_id, exercise_id, occurrence, target_sets, target_reps, superset_group)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [workoutId, exerciseIds[item.key], item.occurrence, SETS_IN_GROUP, REPS, item.group],
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
      await client.query('DELETE FROM exercise WHERE name = ANY($1)', [
        Object.values(exerciseNames),
      ]);
      await client.end();
    },
  };
}
