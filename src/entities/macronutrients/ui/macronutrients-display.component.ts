import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Macronutrients } from '../model/index.js';

@Component({
  selector: 'app-macronutrients-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './macronutrients-display.component.html',
  styleUrl: './macronutrients-display.component.scss',
})
export class MacronutrientsDisplayComponent {
  readonly macros = input<Macronutrients | null>(null);

  private getMacroValue(
    getter: (macros: Macronutrients) => { grams: number; percentage: number },
  ): string {
    const macros = this.macros();
    const values = macros ? getter(macros) : { grams: 0, percentage: 0 };
    return `${values.grams}g (${values.percentage}%)`;
  }

  get proteinValue(): string {
    return this.getMacroValue((macros) => ({
      grams: macros.proteinGrams,
      percentage: macros.proteinPercentage,
    }));
  }

  get fatValue(): string {
    return this.getMacroValue((macros) => ({
      grams: macros.fatGrams,
      percentage: macros.fatPercentage,
    }));
  }

  get carbsValue(): string {
    return this.getMacroValue((macros) => ({
      grams: macros.carbsGrams,
      percentage: macros.carbsPercentage,
    }));
  }
}
