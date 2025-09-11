import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type {
  BasicData,
  ActivityData,
  CalorieCalculationData,
} from '@/features/calorie-calculation';
import {
  isBasicData,
  CalorieCalculatorService,
  CalorieFormStateService,
  ActivityGoalFormComponent,
  BasicDataFormComponent,
  ResultsDisplayComponent,
} from '@/features/calorie-calculation';
import { StepNavigationComponent, BackLayoutComponent, type StepConfig } from '@/shared';
import { StepComponent } from './ui/step';

@Component({
  selector: 'app-calorie-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StepNavigationComponent,
    BackLayoutComponent,
    StepComponent,
    BasicDataFormComponent,
    ActivityGoalFormComponent,
    ResultsDisplayComponent,
  ],
  templateUrl: './calorie-calculator.component.html',
  styleUrl: './calorie-calculator.component.scss',
})
export class CalorieCalculatorComponent {
  private readonly calorieService = inject(CalorieCalculatorService);
  private readonly formStateService = inject(CalorieFormStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = this.calorieService.isLoading;
  protected readonly caloriesResults = this.calorieService.caloriesResults;

  protected readonly currentStep = this.formStateService.currentStep;
  protected readonly basicData = this.formStateService.basicData;
  protected readonly activityData = this.formStateService.activityData;
  protected readonly hasDataChanges = this.formStateService.hasDataChanges;

  protected readonly stepsConfig = computed<StepConfig[]>(() => [
    { title: 'Basic Information' },
    {
      title: 'Activity & Goal',
      disabled: this.formStateService.isActivityTabDisabled(),
    },
    {
      title: 'Results',
      disabled: this.formStateService.isResultsTabDisabled(),
    },
  ]);

  constructor() {
    this.calorieService.fetchCaloriesResult().pipe(takeUntilDestroyed()).subscribe();
  }

  protected onBasicDataSubmitted(data: BasicData): void {
    this.formStateService.setBasicData(data);
  }

  protected onDataChanged(): void {
    this.formStateService.markDataAsChanged();
  }

  protected onActivityDataSubmitted(data: ActivityData): void {
    this.formStateService.setActivityData(data);

    const basicData = this.basicData();
    if (!basicData || !isBasicData(basicData)) {
      throw new Error('Basic data is required and must be valid for calculation');
    }

    const calculationData: CalorieCalculationData = {
      ...basicData,
      ...data,
    };

    this.calorieService
      .fetchCalculateCalories(calculationData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formStateService.setCurrentStep(2);
      });
  }

  protected onRecalculate(): void {
    this.formStateService.resetForm();
  }

  protected onTabClick(index: number): void {
    this.formStateService.setCurrentStep(index);
  }
}
