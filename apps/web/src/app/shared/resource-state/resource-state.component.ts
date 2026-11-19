import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiLoader } from '@taiga-ui/core';
import type { ResourceViewState } from '../../api/resource-view-state';
import { EmptyStateComponent } from '../empty-state';
import { ErrorStateComponent } from '../error-state';

const DEFAULT_EMPTY_MESSAGE = 'Нет данных';
const DEFAULT_LOADING_LABEL = 'Загрузка';
const DEFAULT_ERROR_MESSAGE = 'Не удалось загрузить данные';

@Component({
  selector: 'app-resource-state',
  imports: [EmptyStateComponent, ErrorStateComponent, TuiLoader],
  templateUrl: './resource-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ResourceStateComponent {
  readonly state = input.required<ResourceViewState>();
  readonly emptyMessage = input(DEFAULT_EMPTY_MESSAGE);
  readonly loadingLabel = input(DEFAULT_LOADING_LABEL);
  readonly errorMessage = input(DEFAULT_ERROR_MESSAGE);
  readonly hideEmpty = input(false, { transform: booleanAttribute });
  readonly retry = output<void>();
}
