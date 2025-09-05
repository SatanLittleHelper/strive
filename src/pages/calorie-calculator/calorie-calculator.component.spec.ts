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

  describe('service delegation', () => {
    it('should delegate form state operations to CalorieFormStateService', (): void => {
      const basicData = { age: 25, gender: 'male' as const, height: 180, weight: 75 };

      component.onBasicDataSubmitted(basicData);
      component.onDataChanged();
      component.onRecalculate();
      component.onTabClick(2);

      expect(formStateServiceSpy.setBasicData).toHaveBeenCalledWith(basicData);
      expect(formStateServiceSpy.markDataAsChanged).toHaveBeenCalledTimes(1);
      expect(formStateServiceSpy.resetForm).toHaveBeenCalledTimes(1);
      expect(formStateServiceSpy.setCurrentStep).toHaveBeenCalledWith(2);
    });
  });
});
