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

    component.onOptionSelect('option1');

    expect(component.value).toBe('option1');
    expect(component.valueChange.emit).toHaveBeenCalledWith('option1');
  });

  it('should set value correctly', (): void => {
    component.value = 'option1';

    expect(component.value).toBe('option1');
  });

  it('should stringify option with description', (): void => {
    const result = component.stringify(mockOptions[0]);

    expect(result).toBe('Option 1 (First option)');
  });

  it('should stringify option without description', (): void => {
    const result = component.stringify(mockOptions[1]);

    expect(result).toBe('Option 2');
  });

  it('should implement ControlValueAccessor', (): void => {
    const testValue = 'test';
    const onChangeSpy = jasmine.createSpy('onChange');
    const onTouchedSpy = jasmine.createSpy('onTouched');

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);
    component.writeValue(testValue);

    expect(component.value).toBe(testValue);
  });
});
