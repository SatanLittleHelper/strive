import { TestBed } from '@angular/core/testing';
import type { CalorieResults, Macronutrients } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { ResultsDisplayComponent } from './results-display.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('ResultsDisplayComponent', () => {
  let component: ResultsDisplayComponent;
  let fixture: ComponentFixture<ResultsDisplayComponent>;

  const mockMacronutrients: Macronutrients = {
    proteinGrams: 120,
    fatGrams: 80,
    carbsGrams: 200,
  };

  const mockResults: CalorieResults = {
    bmr: 1800,
    tdee: 2200,
    targetCalories: 2000,
    formula: 'mifflin',
    macros: mockMacronutrients,
  };

  const mockResultsWithoutMacros: CalorieResults = {
    bmr: 1800,
    tdee: 2200,
    targetCalories: 2000,
    formula: 'mifflin',
  };

  beforeEach((): void => {
    configureZonelessTestingModule({
      imports: [ResultsDisplayComponent],
    });

    fixture = TestBed.createComponent(ResultsDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should handle null results', (): void => {
    fixture.componentRef.setInput('results', null);
    fixture.detectChanges();

    expect(component.results()).toBeNull();
  });

  it('should display results when provided', (): void => {
    fixture.componentRef.setInput('results', mockResults);
    fixture.detectChanges();

    const results = component.results();
    expect(results).toEqual(mockResults);
    expect(results?.bmr).toBe(1800);
    expect(results?.tdee).toBe(2200);
    expect(results?.targetCalories).toBe(2000);
  });

  it('should emit recalculatePressed when onRecalculate is called', (): void => {
    fixture.detectChanges();

    spyOn(component.recalculate, 'emit');

    component.onRecalculate();

    expect(component.recalculate.emit).toHaveBeenCalled();
  });

  describe('Macronutrients display', () => {
    it('should display macronutrients when available', (): void => {
      fixture.componentRef.setInput('results', mockResults);
      fixture.detectChanges();

      const results = component.results();
      expect(results?.macros).toBeDefined();
      expect(results?.macros?.proteinGrams).toBe(120);
      expect(results?.macros?.fatGrams).toBe(80);
      expect(results?.macros?.carbsGrams).toBe(200);
    });

    it('should not display macronutrients section when not available', (): void => {
      fixture.componentRef.setInput('results', mockResultsWithoutMacros);
      fixture.detectChanges();

      const results = component.results();
      expect(results?.macros).toBeUndefined();
    });

    it('should calculate macro calories correctly', (): void => {
      fixture.componentRef.setInput('results', mockResults);
      fixture.detectChanges();

      const proteinCalories = component.getMacroCalories(mockMacronutrients, 'proteinGrams');
      const fatCalories = component.getMacroCalories(mockMacronutrients, 'fatGrams');
      const carbsCalories = component.getMacroCalories(mockMacronutrients, 'carbsGrams');

      expect(proteinCalories).toBe(120 * 4); // 480
      expect(fatCalories).toBe(80 * 9); // 720
      expect(carbsCalories).toBe(200 * 4); // 800
    });

    it('should have correct MACRO_KCAL_PER_GRAM constant', (): void => {
      expect(component.MACRO_KCAL_PER_GRAM.protein).toBe(4);
      expect(component.MACRO_KCAL_PER_GRAM.fat).toBe(9);
      expect(component.MACRO_KCAL_PER_GRAM.carbs).toBe(4);
    });
  });
});
