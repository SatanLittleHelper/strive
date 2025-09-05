import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap, map } from 'rxjs';
import { CalorieApiService } from './calorie-api.service';
import type { CalorieCalculationData, CalorieResults } from '../models/calorie-data.types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalorieCalculatorService {
  private readonly apiService = inject(CalorieApiService);

  private readonly _caloriesResults = signal<CalorieResults | null>(null);
  private readonly _isLoading = signal(false);

  readonly caloriesResults = this._caloriesResults.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  fetchCalculateCalories(data: CalorieCalculationData): Observable<void> {
    this._isLoading.set(true);
    return this.apiService.calculateCalories(data).pipe(
      tap((results) => this._caloriesResults.set(results)),
      map(() => void 0),
      finalize(() => this._isLoading.set(false)),
    );
  }

  fetchCaloriesResult(): Observable<void> {
    return this.apiService.getCaloriesResult().pipe(
      tap((data) => {
        if (data) {
          this._caloriesResults.set(data.results);
        }
      }),
      map(() => void 0),
    );
  }
}
