import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

import { MacronutrientsDisplayComponent } from '@/entities';
import type { Macronutrients } from '@/entities/macronutrients';
import type { CalorieResults } from '@/features/calorie-calculation';
import { ResultItemComponent, SectionBlockComponent } from '@/shared';

@Component({
  selector: 'app-results-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, ResultItemComponent, MacronutrientsDisplayComponent, SectionBlockComponent],
  templateUrl: './results-display.component.html',
  styleUrl: './results-display.component.scss',
})
export class ResultsDisplayComponent {
  readonly results = input<CalorieResults | null>(null);
  readonly recalculate = output<void>();

  get targetCaloriesValue(): string {
    const results = this.results();
    return results ? `${results.targetCalories} kcal/day` : '';
  }

  get bmrValue(): string {
    const results = this.results();
    return results ? `${results.bmr} kcal/day` : '';
  }

  get tdeeValue(): string {
    const results = this.results();
    return results ? `${results.tdee} kcal/day` : '';
  }

  get macrosValue(): Macronutrients | null {
    const results = this.results();
    return results ? results.macros : null;
  }

  onRecalculate(): void {
    this.recalculate.emit();
  }
}
