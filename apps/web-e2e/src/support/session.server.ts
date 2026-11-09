import type { Page } from '@playwright/test';
import type {
  SaveSetResultRequest,
  SessionHistoryResponse,
  SetResult,
  WorkoutSession,
} from '@strive/api-interfaces';
import { errorBody, makeSession, ok, STARTED_AT } from './session.fixtures';

const HTTP_OK = 200;
const SET_URL_PATTERN = '**/api/sessions/1/sets/*/*';
const SET_URL_REGEX = /\/sets\/(\d+)\/(\d+)$/;

export interface SavedRequest {
  workoutExerciseId: number;
  setNumber: number;
  body: SaveSetResultRequest;
}

export interface SessionServerOptions {
  session?: WorkoutSession;
  history?: SessionHistoryResponse | { status: number };
  saveStatus?: number;
  finishStatus?: number;
  holdSaves?: boolean;
  holdHistory?: boolean;
}

export interface SessionServer {
  saves: SavedRequest[];
  finishes: string[];
  releaseSaves: () => void;
  releaseHistory: () => void;
}

function createGate(held: boolean): { wait: () => Promise<void>; release: () => void } {
  const state = { release: (): void => undefined };
  const promise = held
    ? new Promise<void>((resolve) => {
        state.release = resolve;
      })
    : Promise.resolve();

  return { wait: () => promise, release: () => state.release() };
}

function withSavedSet(
  session: WorkoutSession,
  { workoutExerciseId, setNumber, body }: SavedRequest,
) {
  const saved: SetResult = {
    workoutExerciseId,
    setNumber,
    weight: body.weight,
    reps: body.reps,
    rpe: body.rpe ?? null,
    note: body.note ?? null,
    completedAt: STARTED_AT,
  };
  const others = session.results.filter(
    (result) => !(result.workoutExerciseId === workoutExerciseId && result.setNumber === setNumber),
  );
  const results = [...others, saved].sort(
    (first, second) =>
      first.workoutExerciseId - second.workoutExerciseId || first.setNumber - second.setNumber,
  );

  return { ...session, results };
}

export async function startSessionServer(
  page: Page,
  options: SessionServerOptions = {},
): Promise<SessionServer> {
  const {
    session = makeSession(),
    history = { exercises: [] },
    saveStatus = HTTP_OK,
    finishStatus = HTTP_OK,
  } = options;
  const state = { session };
  const saveGate = createGate(options.holdSaves ?? false);
  const historyGate = createGate(options.holdHistory ?? false);
  const server: SessionServer = {
    saves: [],
    finishes: [],
    releaseSaves: saveGate.release,
    releaseHistory: historyGate.release,
  };

  await page.route('**/api/sessions/active', (route) =>
    route.fulfill({ json: ok({ session: state.session }) }),
  );
  await page.route('**/api/sessions/1/history', async (route) => {
    await historyGate.wait();

    return 'status' in history
      ? route.fulfill({ status: history.status, json: errorBody })
      : route.fulfill({ json: ok(history) });
  });
  await page.route(SET_URL_PATTERN, async (route) => {
    const match = SET_URL_REGEX.exec(route.request().url());
    if (!match) return route.abort();

    const request: SavedRequest = {
      workoutExerciseId: Number(match[1]),
      setNumber: Number(match[2]),
      body: route.request().postDataJSON() as SaveSetResultRequest,
    };
    server.saves.push(request);
    await saveGate.wait();
    if (saveStatus !== HTTP_OK) return route.fulfill({ status: saveStatus, json: errorBody });

    state.session = withSavedSet(state.session, request);

    return route.fulfill({ json: ok(state.session) });
  });
  await page.route('**/api/sessions/1/finish', (route) => {
    server.finishes.push(route.request().method());

    return finishStatus === HTTP_OK
      ? route.fulfill({ json: ok({ ...state.session, finishedAt: STARTED_AT }) })
      : route.fulfill({ status: finishStatus, json: errorBody });
  });
  // экран истории после завершения запрашивает список сессий
  await page.route(/\/api\/sessions$/, (route) => route.fulfill({ json: ok({ sessions: [] }) }));

  return server;
}
