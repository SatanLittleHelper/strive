import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';

import { MacronutrientsDisplayComponent } from '@/entities';
import { CalorieCalculatorService } from '@/features/calorie-calculation';
import { SectionBlockComponent } from '@/shared';

@Component({
  selector: 'app-calorie-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton, MacronutrientsDisplayComponent, SectionBlockComponent],
  templateUrl: './calorie-widget.component.html',
  styleUrl: './calorie-widget.component.scss',
})
export class CalorieWidgetComponent {
  private readonly router = inject(Router);
  private readonly calorieService = inject(CalorieCalculatorService);

  readonly caloriesResults = this.calorieService.caloriesResults;

  constructor() {
    this.calorieService.fetchCaloriesResult().pipe(takeUntilDestroyed()).subscribe();
  }

  async onCalculateCalories(): Promise<void> {
    await this.router.navigate(['/calorie-calculator']);
  }
}
