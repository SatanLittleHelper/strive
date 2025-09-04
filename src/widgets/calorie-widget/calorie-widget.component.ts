import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';

import { CalorieCalculatorService } from '@/features/calorie-calculation';
import type { OnInit } from '@angular/core';

@Component({
  selector: 'app-calorie-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton],
  templateUrl: './calorie-widget.component.html',
  styleUrl: './calorie-widget.component.scss',
})
export class CalorieWidgetComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly calorieService = inject(CalorieCalculatorService);

  readonly caloriesResults = this.calorieService.caloriesResults;

  ngOnInit(): void {
    this.calorieService.fetchCaloriesResult().subscribe();
  }

  async onCalculateCalories(): Promise<void> {
    await this.router.navigate(['/calorie-calculator']);
  }
}
