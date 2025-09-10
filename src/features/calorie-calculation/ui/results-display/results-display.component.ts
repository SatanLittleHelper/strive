import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

import type { CalorieResults, Macronutrients } from '@/features/calorie-calculation';
import { MACRO_KCAL_PER_GRAM } from '@/features/calorie-calculation';
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

  readonly MACRO_KCAL_PER_GRAM = MACRO_KCAL_PER_GRAM;

  onRecalculate(): void {
    this.recalculate.emit();
  }

  getMacroCalories(macros: Macronutrients, macroType: keyof Macronutrients): number {
    const grams = macros[macroType];
    const caloriesPerGram =
      this.MACRO_KCAL_PER_GRAM[
        macroType === 'proteinGrams' ? 'protein' : macroType === 'fatGrams' ? 'fat' : 'carbs'
      ];
    return Math.round(grams * caloriesPerGram);
  }
}
