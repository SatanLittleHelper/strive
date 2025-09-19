import { DestroyRef, Directive, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroupDirective } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import type { OnInit } from '@angular/core';
import type { FormGroup } from '@angular/forms';

@Directive({
  selector: '[appFormAutosave]',
  host: {
    '(submit)': 'handleFormSubmit()',
  },
})
export class FormAutosaveDirective implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formGroupDirective = inject(FormGroupDirective, { optional: true });

  readonly formAutosaveKey = input<string>();
  readonly formAutosaveEnabled = input<boolean>(true);
  readonly formAutosaveDebounce = input<number>(500);

  readonly formAutosaveLoaded = output<Record<string, unknown>>();
  readonly formAutosaveSaved = output<Record<string, unknown>>();
  readonly formAutosaveCleared = output<void>();

  private readonly formHash = signal<string>('');
  private readonly storageKey = signal<string>('');

  ngOnInit(): void {
    this.initializeFormAutosave();
  }

  private initializeFormAutosave(): void {
    const form = this.getFormGroup();
    if (!form) {
      return;
    }

    const hash = this.generateFormHash(form);
    this.formHash.set(hash);

    const key = this.formAutosaveKey() || hash;
    this.storageKey.set(key);

    this.loadFormData(form);
    this.setupFormValueObserver(form);
  }

  private getFormGroup(): FormGroup | null {
    return this.formGroupDirective?.form || null;
  }

  private generateFormHash(form: FormGroup): string {
    const formStructure = this.getFormStructure(form);
    const structureString = JSON.stringify(formStructure);
    return `form_${this.simpleHash(structureString)}`;
  }

  private getFormStructure(form: FormGroup): Record<string, unknown> {
    const structure: Record<string, unknown> = {};

    Object.keys(form.controls).forEach((controlName) => {
      const control = form.get(controlName);
      if (control) {
        structure[controlName] = {
          type: control.constructor.name,
          validators: control.validator?.toString() || 'none',
        };
      }
    });

    return structure;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private loadFormData(form: FormGroup): void {
    const savedData = this.loadFromStorage();
    if (savedData) {
      form.patchValue(savedData);
      this.formAutosaveLoaded.emit(savedData);
    }
  }

  private setupFormValueObserver(form: FormGroup): void {
    if (!this.formAutosaveEnabled()) {
      return;
    }

    form.valueChanges
      .pipe(
        debounceTime(this.formAutosaveDebounce()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.saveToStorage(value);
      });
  }

  private saveToStorage(data: Record<string, unknown>): void {
    const key = this.storageKey();
    if (!key) return;

    this.safeLocalStorageOperation(() => {
      localStorage.setItem(key, JSON.stringify(data));
    });
    this.formAutosaveSaved.emit(data);
  }

  private loadFromStorage(): Record<string, unknown> | null {
    const key = this.storageKey();
    if (!key) return null;

    return this.safeLocalStorageOperation(() => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    });
  }

  private clearFromStorage(): void {
    const key = this.storageKey();
    if (!key) return;

    this.safeLocalStorageOperation(() => {
      localStorage.removeItem(key);
    });
  }

  private safeLocalStorageOperation<T>(operation: () => T): T | null {
    try {
      return operation();
    } catch {
      return null;
    }
  }

  handleFormSubmit(): void {
    this.clearFromStorage();
    this.formAutosaveCleared.emit();
  }
}
