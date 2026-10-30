import type { ResourceViewState, ResourceViewStateParams } from './resource-view-state.types';

export function getResourceViewState({
  status,
  isEmpty,
}: ResourceViewStateParams): ResourceViewState {
  switch (status) {
    case 'error':
      return 'error';
    case 'idle':
    case 'loading':
      return 'loading';
    case 'reloading':
      // повторный запрос не прячет уже показанные данные
      return isEmpty ? 'loading' : 'ready';
    case 'resolved':
    case 'local':
      return isEmpty ? 'empty' : 'ready';
  }
}
