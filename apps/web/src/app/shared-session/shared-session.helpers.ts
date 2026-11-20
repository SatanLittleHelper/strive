import type {
  SetResult,
  SharedSessionResponse,
  WorkoutExercise,
  WorkoutSession,
} from '@strive/api-interfaces';
import { getSavedSetNumbers, isExerciseDone } from '../sessions';
import { groupSupersets } from '../workouts';
import type {
  SharedCounters,
  SharedExerciseStatus,
  SharedExerciseView,
  SharedView,
} from './shared-session.types';

// существующие помощники прогресса принимают WorkoutSession; заметок у друга нет
function toProgressSession(shared: SharedSessionResponse): WorkoutSession {
  return {
    id: 0,
    workout: shared.workout,
    startedAt: shared.startedAt,
    finishedAt: shared.finishedAt,
    results: shared.results.map((result) => ({ ...result, note: null })),
  };
}

// подходы сверх плана не считаются
function countDoneSets(exercise: WorkoutExercise, results: SetResult[]): number {
  return [...getSavedSetNumbers({ exercise, results })].filter(
    (setNumber) => setNumber <= exercise.sets,
  ).length;
}

function getCounters(session: WorkoutSession): SharedCounters {
  const { exercises } = session.workout;
  const doneSets = exercises.reduce(
    (sum, exercise) => sum + countDoneSets(exercise, session.results),
    0,
  );
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const doneExercises = exercises.filter((exercise) =>
    isExerciseDone({ exercise, results: session.results }),
  ).length;

  return {
    remainingSets: totalSets - doneSets,
    totalSets,
    remainingExercises: exercises.length - doneExercises,
    totalExercises: exercises.length,
  };
}

function getStatus({
  exercise,
  results,
  finished,
  currentIds,
}: {
  exercise: WorkoutExercise;
  results: SetResult[];
  finished: boolean;
  currentIds: Set<number>;
}): SharedExerciseStatus {
  // у завершённой тренировки «выполнено» значит «есть хотя бы один подход»
  if (finished) {
    return results.some((result) => result.workoutExerciseId === exercise.id) ? 'done' : 'skipped';
  }
  if (currentIds.has(exercise.id)) return 'current';

  return isExerciseDone({ exercise, results }) ? 'done' : 'todo';
}

export function toSharedView(shared: SharedSessionResponse): SharedView {
  const progressSession = toProgressSession(shared);
  const { results } = progressSession;
  const finished = shared.finishedAt !== null;
  const groups = groupSupersets(shared.workout.exercises);
  // «текущее» — незавершённые упражнения первой незавершённой строки плана: в суперсете подходы
  // чередуются, поэтому раскрыт весь суперсет; когда выполнено всё, метки нет
  const isOpen = (exercise: WorkoutExercise) => !isExerciseDone({ exercise, results });
  const currentRow = finished ? undefined : groups.find(({ items }) => items.some(isOpen));
  const active = (currentRow?.items ?? []).filter(isOpen);
  const currentIds = new Set(active.map((exercise) => exercise.id));
  const expandedIds = new Set(currentRow?.items.map((exercise) => exercise.id));
  const rows = groups.map(({ items, superset }) => ({
    superset,
    items: items.map((exercise): SharedExerciseView => {
      const status = getStatus({ exercise, results, finished, currentIds });

      return {
        id: exercise.id,
        name: exercise.exercise.name,
        status,
        doneSets: countDoneSets(exercise, results),
        plannedSets: exercise.sets,
        sets: expandedIds.has(exercise.id)
          ? shared.results.filter((result) => result.workoutExerciseId === exercise.id)
          : [],
      };
    }),
  }));

  return {
    progressSession,
    currentId: active[0]?.id ?? null,
    counters: getCounters(progressSession),
    rows,
    summary:
      shared.finishedAt === null
        ? null
        : {
            startedAt: shared.startedAt,
            finishedAt: shared.finishedAt,
            exerciseCount: shared.exerciseCount,
            setCount: shared.setCount,
            totalVolume: shared.totalVolume,
          },
  };
}
