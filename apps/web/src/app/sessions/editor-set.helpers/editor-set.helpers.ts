import { getActiveSetNumber } from '../session-form.helpers';
import { getSavedSetNumbers } from '../session-progress.helpers';
import { NO_EDITOR_SET } from '../sessions.constants';
import type { EditorSet, EditorSetParams } from '../session-view.types';

export function getEditorSet({ exercise, results, selected }: EditorSetParams): EditorSet {
  const params = { exercise, results };
  if (selected !== null && getSavedSetNumbers(params).has(selected)) {
    return { mode: 'edit', setNumber: selected };
  }

  const active = getActiveSetNumber(params);

  return active !== null ? { mode: 'plan', setNumber: active } : NO_EDITOR_SET;
}
