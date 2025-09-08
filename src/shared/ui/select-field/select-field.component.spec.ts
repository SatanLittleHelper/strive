import { TestBed } from '@angular/core/testing';
import { FormsModule, NgControl } from '@angular/forms';
import type { SelectOption } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';
import { SelectFieldComponent } from './select-field.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('SelectFieldComponent', () => {
  let component: SelectFieldComponent;
  let fixture: ComponentFixture<SelectFieldComponent>;

  const mockOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1', description: 'First option' },
    { value: 'option2', label: 'Option 2' },
  ];

  beforeEach((): void => {
    configureZonelessTestingModule({
      imports: [SelectFieldComponent, FormsModule],
      providers: [
        {
          provide: NgControl,
          useValue: {
            control: {
              value: null,
              setValue: jasmine.createSpy('setValue'),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();
  });

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should select option', (): void => {
    spyOn(component.valueChange, 'emit');

    component.onOptionSelect(mockOptions[0]);

    expect(component.selectedOption()).toEqual(mockOptions[0]);
    expect(component.valueChange.emit).toHaveBeenCalledWith('option1');
  });

  it('should set value correctly', (): void => {
    component.writeValue('option1');

    expect(component.selectedOption()).toEqual(mockOptions[0]);
  });

  it('should handle null value correctly', (): void => {
    component.writeValue(null);

    expect(component.selectedOption()).toBeNull();
  });

  it('should implement ControlValueAccessor', (): void => {
    const testValue = 'option1';
    const onChangeSpy = jasmine.createSpy('onChange');
    const onTouchedSpy = jasmine.createSpy('onTouched');

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);
    component.writeValue(testValue);

    expect(component.selectedOption()).toEqual(mockOptions[0]);

    component.onOptionSelect(mockOptions[1]);

    expect(onChangeSpy).toHaveBeenCalledWith('option2');
    expect(onTouchedSpy).toHaveBeenCalled();
  });
});
