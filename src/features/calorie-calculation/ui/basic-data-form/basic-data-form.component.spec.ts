import { TestBed } from '@angular/core/testing';
import { Gender } from '@/features/calorie-calculation';
import type { BasicData } from '@/features/calorie-calculation';
import { configureZonelessTestingModule } from '@/test-setup';
import { BasicDataFormComponent } from './basic-data-form.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('BasicDataFormComponent', () => {
  let component: BasicDataFormComponent;
  let fixture: ComponentFixture<BasicDataFormComponent>;

  const mockBasicData: BasicData = {
    gender: Gender.MALE,
    age: 30,
    height: 180,
    weight: 80,
  };

  beforeEach((): void => {
    configureZonelessTestingModule({
      imports: [BasicDataFormComponent],
    });

    fixture = TestBed.createComponent(BasicDataFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with initial data when provided', (): void => {
    fixture.componentRef.setInput('initialData', mockBasicData);
    fixture.detectChanges();

    expect(component.form.get('age')?.value).toBe(30);
    expect(component.form.get('gender')?.value).toBe('male');
    expect(component.form.get('height')?.value).toBe(180);
    expect(component.form.get('weight')?.value).toBe(80);
  });

  it('should emit dataSubmitted when form is valid', (): void => {
    fixture.detectChanges();

    component.form.patchValue(mockBasicData);
    spyOn(component.dataSubmitted, 'emit');

    component.onSubmit();

    expect(component.dataSubmitted.emit).toHaveBeenCalledWith(mockBasicData);
  });

  it('should emit dataChanged when form values change', (): void => {
    fixture.detectChanges();

    spyOn(component.dataChanged, 'emit');

    component.form.patchValue({ age: 30 });

    expect(component.dataChanged.emit).toHaveBeenCalled();
  });

  it('should have proper form structure', (): void => {
    fixture.detectChanges();

    expect(component.form.get('age')).toBeTruthy();
    expect(component.form.get('gender')).toBeTruthy();
    expect(component.form.get('height')).toBeTruthy();
    expect(component.form.get('weight')).toBeTruthy();
  });

  it('should validate required fields', (): void => {
    fixture.detectChanges();

    const ageControl = component.form.get('age');
    const genderControl = component.form.get('gender');
    const heightControl = component.form.get('height');
    const weightControl = component.form.get('weight');

    expect(ageControl?.hasError('required')).toBeTruthy();
    expect(genderControl?.hasError('required')).toBeTruthy();
    expect(heightControl?.hasError('required')).toBeTruthy();
    expect(weightControl?.hasError('required')).toBeTruthy();
  });
});
