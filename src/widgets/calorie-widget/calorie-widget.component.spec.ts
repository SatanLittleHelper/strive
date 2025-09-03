import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CalorieCalculatorService } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieWidgetComponent } from '@/widgets';
import type { ComponentFixture } from '@angular/core/testing';

describe('CalorieWidgetComponent', () => {
  let component: CalorieWidgetComponent;
  let fixture: ComponentFixture<CalorieWidgetComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let calorieServiceSpy: jasmine.SpyObj<CalorieCalculatorService>;

  const mockCaloriesResults = {
    targetCalories: 2000,
    tdee: 2200,
    formula: 'mifflin' as const,
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    calorieServiceSpy = jasmine.createSpyObj('CalorieCalculatorService', [], {
      caloriesResults: signal(mockCaloriesResults),
    });

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
    const serviceWithNoResults = jasmine.createSpyObj('CalorieCalculatorService', [], {
      caloriesResults: signal(null),
    });

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
});
