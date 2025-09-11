import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, NgControl } from '@angular/forms';
import { ActivityGoalFormComponent, DEFAULT_ACTIVITY_DATA } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import type { ComponentFixture } from '@angular/core/testing';

class MockNgControl extends NgControl {
  control = new FormControl();
  viewToModelUpdate(): void {}
}

describe('ActivityGoalFormComponent', () => {
  let component: ActivityGoalFormComponent;
  let fixture: ComponentFixture<ActivityGoalFormComponent>;
  let mockData: { activityLevel: 'moderately_active'; goal: 'maintain_weight' };

  beforeEach((): void => {
    configureZonelessTestingModule({
      imports: [ActivityGoalFormComponent, ReactiveFormsModule],
      providers: [
        {
          provide: NgControl,
          useClass: MockNgControl,
        },
      ],
    });

    fixture = TestBed.createComponent(ActivityGoalFormComponent);
    component = fixture.componentInstance;

    mockData = {
      activityLevel: 'moderately_active' as const,
      goal: 'maintain_weight' as const,
    };
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', (): void => {
    fixture.detectChanges();

    expect(component.form.get('activityLevel')?.value).toBe(DEFAULT_ACTIVITY_DATA.activityLevel);
    expect(component.form.get('goal')?.value).toBe(DEFAULT_ACTIVITY_DATA.goal);
  });

  it('should initialize form with initial data when provided', (): void => {
    fixture.componentRef.setInput('initialData', mockData);
    fixture.detectChanges();

    expect(component.form.get('activityLevel')?.value).toBe('moderately_active');
    expect(component.form.get('goal')?.value).toBe('maintain_weight');
  });

  it('should emit dataSubmitted when form is valid', (): void => {
    fixture.detectChanges();

    component.form.patchValue(mockData);
    spyOn(component.dataSubmitted, 'emit');

    component.onSubmit();

    expect(component.dataSubmitted.emit).toHaveBeenCalledWith(mockData);
  });

  it('should emit dataChanged when form values change', (): void => {
    fixture.detectChanges();

    spyOn(component.dataChanged, 'emit');

    component.form.patchValue({ activityLevel: 'moderate' });

    expect(component.dataChanged.emit).toHaveBeenCalled();
  });

  it('should have proper form structure', (): void => {
    fixture.detectChanges();

    expect(component.form.get('activityLevel')).toBeTruthy();
    expect(component.form.get('goal')).toBeTruthy();
  });

  it('should validate required fields', (): void => {
    fixture.detectChanges();

    const activityLevelControl = component.form.get('activityLevel');
    const goalControl = component.form.get('goal');

    expect(activityLevelControl?.hasError('required')).toBeFalsy();
    expect(goalControl?.hasError('required')).toBeFalsy();
  });
});
