import { TestBed } from '@angular/core/testing';
import type { CalorieResults } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { ResultsDisplayComponent } from './results-display.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('ResultsDisplayComponent', () => {
  let component: ResultsDisplayComponent;
  let fixture: ComponentFixture<ResultsDisplayComponent>;

  const mockResults: CalorieResults = {
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
});
