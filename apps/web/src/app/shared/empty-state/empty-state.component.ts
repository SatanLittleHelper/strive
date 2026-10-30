import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiNotification } from '@taiga-ui/core';

@Component({
  selector: 'app-empty-state',
  imports: [TuiNotification],
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class EmptyStateComponent {
  readonly message = input.required<string>();
}
