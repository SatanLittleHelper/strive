import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  CalorieCalculatorService,
  CalorieFormStateService,
  type BasicData,
} from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieCalculatorComponent } from './calorie-calculator.component';
import type { ComponentFixture } from '@angular/core/testing';

class TestCalorieCalculatorComponent extends CalorieCalculatorComponent {
  public override onBasicDataSubmitted(data: BasicData): void {
    return super.onBasicDataSubmitted(data);
  }

  public override onDataChanged(): void {
    return super.onDataChanged();
  }

  public override onRecalculate(): void {
    return super.onRecalculate();
  }

  public override onTabClick(index: number): void {
    return super.onTabClick(index);
  }
}

describe('CalorieCalculatorComponent', () => {
  let component: TestCalorieCalculatorComponent;
  let fixture: ComponentFixture<TestCalorieCalculatorComponent>;
  let calorieServiceSpy: jasmine.SpyObj<CalorieCalculatorService>;
  let formStateServiceSpy: jasmine.SpyObj<CalorieFormStateService>;

  beforeEach((): void => {
    const calorieSpy = jasmine.createSpyObj(
      'CalorieCalculatorService',
      ['fetchCalculateCalories', 'fetchCaloriesResult'],
      {
        isLoading: signal(false),
        caloriesResults: signal(null),
      },
    );

    const formStateSpy = jasmine.createSpyObj(
      'CalorieFormStateService',
      [
        'setBasicData',
        'setActivityData',
        'setCurrentStep',
        'markDataAsChanged',
        'resetForm',
        'resetFormData',
        'isActivityTabDisabled',
        'isResultsTabDisabled',
      ],
      {
        currentStep: signal(0),
        basicData: signal(null),
        activityData: signal(null),
        hasDataChanges: signal(true),
      },
    );

    calorieSpy.fetchCalculateCalories.and.returnValue(of(undefined));
    calorieSpy.fetchCaloriesResult.and.returnValue(of(undefined));

    configureZonelessTestingModule({
      imports: [TestCalorieCalculatorComponent],
      providers: [
        { provide: CalorieCalculatorService, useValue: calorieSpy },
        { provide: CalorieFormStateService, useValue: formStateSpy },
      ],
    });

    fixture = TestBed.createComponent(TestCalorieCalculatorComponent);
    component = fixture.componentInstance;
    calorieServiceSpy = TestBed.inject(
      CalorieCalculatorService,
    ) as jasmine.SpyObj<CalorieCalculatorService>;
    formStateServiceSpy = TestBed.inject(
      CalorieFormStateService,
    ) as jasmine.SpyObj<CalorieFormStateService>;
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should call fetchCaloriesResult in constructor', (): void => {
    expect(calorieServiceSpy.fetchCaloriesResult).toHaveBeenCalledTimes(1);
  });

  it('should reset form when component is destroyed', (): void => {
    fixture.destroy();
    expect(formStateServiceSpy.resetForm).toHaveBeenCalledTimes(1);
  });

  describe('service delegation', () => {
    it('should delegate form state operations to CalorieFormStateService', (): void => {
      const basicData = { age: 25, gender: 'male' as const, height: 180, weight: 75 };

      component.onBasicDataSubmitted(basicData);
      component.onDataChanged();
      component.onRecalculate();
      component.onTabClick(2);

      expect(formStateServiceSpy.setBasicData).toHaveBeenCalledWith(basicData);
      expect(formStateServiceSpy.markDataAsChanged).toHaveBeenCalledTimes(1);
      expect(formStateServiceSpy.resetFormData).toHaveBeenCalledTimes(1);
      expect(formStateServiceSpy.setCurrentStep).toHaveBeenCalledWith(0);
      expect(formStateServiceSpy.setCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  describe('error handling', () => {
    it('should throw error when basicData is null in onActivityDataSubmitted', (): void => {
      const activityData = {
        activityLevel: 'moderately_active' as const,
        goal: 'maintain_weight' as const,
      };

      expect(() => {
        (
          component as unknown as { onActivityDataSubmitted: (data: unknown) => void }
        ).onActivityDataSubmitted(activityData);
      }).toThrowError('Basic data is required and must be valid for calculation');
    });

    it('should throw error when basicData is invalid in onActivityDataSubmitted', (): void => {
      const invalidBasicData = { age: 25, height: 180, weight: 75 }; // Missing gender field
      (formStateServiceSpy.basicData as unknown as { set: (data: unknown) => void }).set(
        invalidBasicData,
      );

      const activityData = {
        activityLevel: 'moderately_active' as const,
        goal: 'maintain_weight' as const,
      };

      expect(() => {
        (
          component as unknown as { onActivityDataSubmitted: (data: unknown) => void }
        ).onActivityDataSubmitted(activityData);
      }).toThrowError('Basic data is required and must be valid for calculation');
    });
  });
});
