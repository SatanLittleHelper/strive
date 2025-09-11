import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { configureZonelessTestingModule } from '@/test-setup';
import { FormAutosaveDirective } from './form-autosave.directive';
import type { ComponentFixture } from '@angular/core/testing';
import type { FormGroup } from '@angular/forms';

@Component({
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" appFormAutosave>
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  `,
  imports: [ReactiveFormsModule, FormAutosaveDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestComponent {
  form: FormGroup;
  submitted = signal(false);

  constructor() {
    const fb = new FormBuilder();
    this.form = fb.group({
      name: [''],
      email: [''],
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
  }
}

describe('FormAutosaveDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: FormAutosaveDirective;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [TestComponent],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement
      .query(By.directive(FormAutosaveDirective))
      .injector.get(FormAutosaveDirective);

    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'removeItem');

    fixture.detectChanges();

    spyOn(directive, 'getFormGroup' as never).and.returnValue(component.form);
  });

  describe('Initialization', () => {
    it('should create directive', () => {
      expect(directive).toBeTruthy();
    });

    it('should generate form hash', () => {
      directive['initializeFormAutosave']();
      expect(directive['formHash']()).toBeTruthy();
      expect(directive['formHash']()).toMatch(/^form_[a-z0-9]+$/);
    });

    it('should set storage key', () => {
      directive['initializeFormAutosave']();
      expect(directive['storageKey']()).toBeTruthy();
    });
  });

  describe('Hash Generation', () => {
    it('should generate same hash for same form structure', () => {
      const hash1 = directive['generateFormHash'](component.form);
      const hash2 = directive['generateFormHash'](component.form);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different form structures', () => {
      const form1 = component.form;
      const form2 = new FormBuilder().group({
        name: [''],
        email: [''],
        age: [''],
      });

      const hash1 = directive['generateFormHash'](form1);
      const hash2 = directive['generateFormHash'](form2);
      expect(hash1).not.toBe(hash2);
    });

    it('should use form hash when no custom key provided', () => {
      directive['initializeFormAutosave']();

      expect(directive['storageKey']()).toBe(directive['formHash']());
    });
  });

  describe('Storage Operations', () => {
    it('should save form data to localStorage', () => {
      directive['initializeFormAutosave']();
      const testData = { name: 'John', email: 'john@example.com' };

      directive['saveToStorage'](testData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        directive['storageKey'](),
        JSON.stringify(testData),
      );
    });

    it('should load form data from localStorage', () => {
      directive['initializeFormAutosave']();
      const testData = { name: 'Jane', email: 'jane@example.com' };
      (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(testData));

      directive['loadFormData'](component.form);

      expect(component.form.value).toEqual(testData);
    });

    it('should clear data on form submit', () => {
      directive['initializeFormAutosave']();
      directive.handleFormSubmit();

      expect(localStorage.removeItem).toHaveBeenCalledWith(directive['storageKey']());
    });

    it('should handle localStorage errors gracefully', () => {
      directive['initializeFormAutosave']();
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage error');

      expect(() => directive['saveToStorage']({ test: 'data' })).not.toThrow();
    });
  });

  describe('Debounce Mechanism', () => {
    it('should setup form value observer', () => {
      spyOn(component.form.valueChanges, 'pipe').and.callThrough();

      directive['setupFormValueObserver'](component.form);

      expect(component.form.valueChanges.pipe).toHaveBeenCalled();
    });
  });

  describe('Form Value Observer', () => {
    it('should emit saved event when data is saved', () => {
      directive['initializeFormAutosave']();
      spyOn(directive.formAutosaveSaved, 'emit');

      directive['saveToStorage']({ name: 'Test', email: '' });

      expect(directive.formAutosaveSaved.emit).toHaveBeenCalledWith({ name: 'Test', email: '' });
    });
  });

  describe('Form Submit Handler', () => {
    it('should emit cleared event on form submit', () => {
      spyOn(directive.formAutosaveCleared, 'emit');

      directive.handleFormSubmit();

      expect(directive.formAutosaveCleared.emit).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle when no FormGroup is found', () => {
      (directive as never).getFormGroup = jasmine.createSpy().and.returnValue(null);

      expect(() => directive['initializeFormAutosave']()).not.toThrow();
    });

    it('should handle JSON parse errors', () => {
      directive['initializeFormAutosave']();
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid json');

      const result = directive['loadFromStorage']();

      expect(result).toBeNull();
    });
  });
});
