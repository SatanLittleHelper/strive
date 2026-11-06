import { getActiveSetNumber } from '../session-form.helpers';
import { canAddSet, getLastSetNumber, getSavedSetNumbers } from '../session-progress.helpers';
import { NO_EDITOR_SET } from '../sessions.constants';
import type { EditorSet, EditorSetParams } from '../session-view.types';

export function getEditorSet({ exercise, results, selected, adding }: EditorSetParams): EditorSet {
  const params = { exercise, results };
  if (selected !== null && getSavedSetNumbers(params).has(selected)) {
    return { mode: 'edit', setNumber: selected };
  }

  const active = getActiveSetNumber(params);
  if (active !== null) return { mode: 'plan', setNumber: active };

  if (adding && canAddSet(params)) {
    return { mode: 'extra', setNumber: getLastSetNumber(params) + 1 };
  }

  return NO_EDITOR_SET;
}
