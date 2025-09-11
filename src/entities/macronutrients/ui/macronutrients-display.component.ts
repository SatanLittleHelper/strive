import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Macronutrients } from '../model/index.js';

@Component({
  selector: 'app-macronutrients-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './macronutrients-display.component.html',
  styleUrl: './macronutrients-display.component.scss',
})
export class MacronutrientsDisplayComponent {
  readonly macros = input.required<Macronutrients>();

  get proteinValue(): string {
    const macros = this.macros();
    return `${macros.proteinGrams}g (${macros.proteinPercentage}%)`;
  }

  get fatValue(): string {
    const macros = this.macros();
    return `${macros.fatGrams}g (${macros.fatPercentage}%)`;
  }

  get carbsValue(): string {
    const macros = this.macros();
    return `${macros.carbsGrams}g (${macros.carbsPercentage}%)`;
  }
}
