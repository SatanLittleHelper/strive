import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiProgressCircle } from '@taiga-ui/kit';

@Component({
  selector: 'app-ring',
  imports: [TuiProgressCircle],
  templateUrl: './ring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative inline-grid place-items-center',
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
})
export class RingComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();
  readonly color = input<string | null>(null);
}
