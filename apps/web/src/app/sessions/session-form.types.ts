import type { SaveSetResultRequest } from '@strive/api-interfaces';

export interface RawSetInput {
  weight: string;
  reps: string;
  rpe: string;
  note: string;
}

export type SetInputValidation =
  { ok: true; value: SaveSetResultRequest } | { ok: false; error: string };
