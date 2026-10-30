import type { ResourceStatus } from '@angular/core';

export type ResourceViewState = 'loading' | 'error' | 'empty' | 'ready';

export interface ResourceViewStateParams {
  status: ResourceStatus;
  isEmpty: boolean;
}
