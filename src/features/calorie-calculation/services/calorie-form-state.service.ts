import { Injectable, signal } from '@angular/core';
import type { BasicData, ActivityData } from '../models/calorie-data.types';

@Injectable({ providedIn: 'root' })
export class CalorieFormStateService {
  private readonly _currentStep = signal<number>(0);
  private readonly _basicData = signal<BasicData | null>(null);
  private readonly _activityData = signal<ActivityData | null>(null);
  private readonly _hasDataChanges = signal<boolean>(true);

  readonly currentStep = this._currentStep.asReadonly();
  readonly basicData = this._basicData.asReadonly();
  readonly activityData = this._activityData.asReadonly();
  readonly hasDataChanges = this._hasDataChanges.asReadonly();

  setCurrentStep(step: number): void {
    this._currentStep.set(step);
  }

  setBasicData(data: BasicData): void {
    this._basicData.set(data);
    this._hasDataChanges.set(false);
    this._currentStep.set(1);
  }

  setActivityData(data: ActivityData): void {
    this._activityData.set(data);
    this._hasDataChanges.set(false);
  }

  markDataAsChanged(): void {
    this._hasDataChanges.set(true);
  }

  resetForm(): void {
    this._currentStep.set(0);
    this._basicData.set(null);
    this._activityData.set(null);
    this._hasDataChanges.set(true);
  }

  resetFormData(): void {
    this._basicData.set(null);
    this._activityData.set(null);
    this._hasDataChanges.set(true);
  }

  isActivityTabDisabled(): boolean {
    return !this._basicData();
  }

  isResultsTabDisabled(): boolean {
    return !this._basicData() || !this._activityData();
  }
}
