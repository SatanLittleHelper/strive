import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CalorieCalculatorService } from '@/features/calorie-calculation';
import type { Macronutrients } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieWidgetComponent } from './calorie-widget.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('CalorieWidgetComponent', () => {
  let component: CalorieWidgetComponent;
  let fixture: ComponentFixture<CalorieWidgetComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let calorieServiceSpy: jasmine.SpyObj<CalorieCalculatorService>;

  const mockMacronutrients: Macronutrients = {
    proteinGrams: 120,
    fatGrams: 80,
    carbsGrams: 200,
  };

  const mockCaloriesResults = {
    targetCalories: 2000,
    tdee: 2200,
    formula: 'mifflin' as const,
    macros: mockMacronutrients,
  };

  const mockCaloriesResultsWithoutMacros = {
    targetCalories: 2000,
    tdee: 2200,
    formula: 'mifflin' as const,
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    calorieServiceSpy = jasmine.createSpyObj('CalorieCalculatorService', ['fetchCaloriesResult'], {
      caloriesResults: signal(mockCaloriesResults),
    });
    calorieServiceSpy.fetchCaloriesResult.and.returnValue(of(void 0));

    configureZonelessTestingModule({
      imports: [CalorieWidgetComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CalorieCalculatorService, useValue: calorieServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(CalorieWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load saved calories results on init', () => {
    fixture.detectChanges();

    expect(calorieServiceSpy.fetchCaloriesResult).toHaveBeenCalled();
  });

  it('should display title', () => {
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.calorie-widget__title');
    expect(titleElement.textContent.trim()).toBe('Calorie Calculator');
  });

  it('should display correct state when caloriesResults has data', () => {
    fixture.detectChanges();

    const targetElement = fixture.nativeElement.querySelector('.calorie-widget__target');
    const tdeeElement = fixture.nativeElement.querySelector('.calorie-widget__tdee');
    const button = fixture.nativeElement.querySelector('button');

    expect(targetElement.textContent).toContain('2000');
    expect(tdeeElement.textContent).toContain('2200');
    expect(button.textContent.trim()).toBe('Recalculate');
    expect(button.disabled).toBeFalsy();
  });

  it('should display correct state when no caloriesResults', () => {
    const serviceWithNoResults = jasmine.createSpyObj(
      'CalorieCalculatorService',
      ['fetchCaloriesResult'],
      {
        caloriesResults: signal(null),
      },
    );
    serviceWithNoResults.fetchCaloriesResult.and.returnValue(of(void 0));

    TestBed.resetTestingModule();
    configureZonelessTestingModule({
      imports: [CalorieWidgetComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CalorieCalculatorService, useValue: serviceWithNoResults },
      ],
    });

    const fixtureWithNoResults = TestBed.createComponent(CalorieWidgetComponent);
    fixtureWithNoResults.detectChanges();

    const descriptionElement = fixtureWithNoResults.nativeElement.querySelector(
      '.calorie-widget__description',
    );
    const button = fixtureWithNoResults.nativeElement.querySelector('button');

    expect(descriptionElement.textContent.trim()).toContain('Calculate your daily calorie needs');
    expect(button.textContent.trim()).toBe('Calculate Calories');
    expect(button.disabled).toBeFalsy();
  });

  it('should navigate to calorie calculator on button click', async () => {
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/calorie-calculator']);
  });

  describe('Macronutrients display', () => {
    it('should display macronutrients when available', () => {
      fixture.detectChanges();

      const macrosSection = fixture.nativeElement.querySelector('.calorie-widget__macros');
      const macroItems = fixture.nativeElement.querySelectorAll('.calorie-widget__macro-item');

      expect(macrosSection).toBeTruthy();
      expect(macroItems.length).toBe(3);
      expect(macroItems[0].textContent).toContain('P: 120g');
      expect(macroItems[1].textContent).toContain('F: 80g');
      expect(macroItems[2].textContent).toContain('C: 200g');
    });

    it('should not display macronutrients section when not available', () => {
      const serviceWithoutMacros = jasmine.createSpyObj(
        'CalorieCalculatorService',
        ['fetchCaloriesResult'],
        {
          caloriesResults: signal(mockCaloriesResultsWithoutMacros),
        },
      );
      serviceWithoutMacros.fetchCaloriesResult.and.returnValue(of(void 0));

      TestBed.resetTestingModule();
      configureZonelessTestingModule({
        imports: [CalorieWidgetComponent],
        providers: [
          { provide: Router, useValue: routerSpy },
          { provide: CalorieCalculatorService, useValue: serviceWithoutMacros },
        ],
      });

      const fixtureWithoutMacros = TestBed.createComponent(CalorieWidgetComponent);
      fixtureWithoutMacros.detectChanges();

      const macrosSection =
        fixtureWithoutMacros.nativeElement.querySelector('.calorie-widget__macros');
      expect(macrosSection).toBeFalsy();
    });

    it('should display correct macro values', () => {
      fixture.detectChanges();

      const macroItems = fixture.nativeElement.querySelectorAll('.calorie-widget__macro-item');

      expect(macroItems[0].textContent.trim()).toBe('P: 120g');
      expect(macroItems[1].textContent.trim()).toBe('F: 80g');
      expect(macroItems[2].textContent.trim()).toBe('C: 200g');
    });
  });
});
