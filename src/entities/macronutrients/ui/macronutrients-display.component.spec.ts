import { TestBed } from '@angular/core/testing';
import { MacronutrientsDisplayComponent } from '@/entities';
import type { Macronutrients } from '@/entities';
import { configureZonelessTestingModule } from '@/test-setup';
import type { ComponentFixture } from '@angular/core/testing';

describe('MacronutrientsDisplayComponent', () => {
  let component: MacronutrientsDisplayComponent;
  let fixture: ComponentFixture<MacronutrientsDisplayComponent>;

  const mockMacronutrients: Macronutrients = {
    proteinGrams: 120,
    fatGrams: 80,
    carbsGrams: 200,
    proteinPercentage: 25.0,
    fatPercentage: 35.0,
    carbsPercentage: 40.0,
  };

  beforeEach((): void => {
    configureZonelessTestingModule({
      imports: [MacronutrientsDisplayComponent],
    });

    fixture = TestBed.createComponent(MacronutrientsDisplayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('macros', mockMacronutrients);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display protein value correctly', () => {
    expect(component.proteinValue).toBe('120g (25%)');
  });

  it('should display fat value correctly', () => {
    expect(component.fatValue).toBe('80g (35%)');
  });

  it('should display carbs value correctly', () => {
    expect(component.carbsValue).toBe('200g (40%)');
  });

  it('should render macronutrients in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Protein:');
    expect(compiled.textContent).toContain('120g (25%)');
    expect(compiled.textContent).toContain('Fat:');
    expect(compiled.textContent).toContain('80g (35%)');
    expect(compiled.textContent).toContain('Carbs:');
    expect(compiled.textContent).toContain('200g (40%)');
  });
});
