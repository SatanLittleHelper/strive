import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

import type { CalorieResults } from '@/features/calorie-calculation';
import { ResultItemComponent } from '@/shared';

@Component({
  selector: 'app-results-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, ResultItemComponent],
  templateUrl: './results-display.component.html',
  styleUrl: './results-display.component.scss',
})
export class ResultsDisplayComponent {
  readonly results = input<CalorieResults | null>(null);
  readonly recalculate = output<void>();

  onRecalculate(): void {
    this.recalculate.emit();
  }
}
