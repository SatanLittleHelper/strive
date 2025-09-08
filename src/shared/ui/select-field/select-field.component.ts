import { ChangeDetectionStrategy, Component, input, output, signal, computed } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiDataList, tuiItemsHandlersProvider, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiSelect } from '@taiga-ui/kit';

import type { SelectOption } from '@/shared';
import { identityMatcherSelectOption } from '@/shared';
import type { ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiTextfield, TuiSelect, TuiDataList, TuiChevron, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectFieldComponent,
      multi: true,
    },
    tuiItemsHandlersProvider({
      stringify: signal((x: SelectOption): string =>
        x.description ? `${x.label} (${x.description})` : x.label,
      ),
      identityMatcher: signal(identityMatcherSelectOption),
    }),
  ],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
})
export class SelectFieldComponent implements ControlValueAccessor {
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string>('Select an option');
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');
  readonly required = input<boolean>(false);

  readonly valueChange = output<string>();

  private readonly selectedValue = signal<string | null>(null);

  readonly selectedOption = computed((): SelectOption | null => {
    const value = this.selectedValue();
    if (!value) return null;
    return this.options().find((option) => option.value === value) ?? null;
  });

  private _onChange = (value: string | null): void => {
    void value;
  };
  private _onTouched = (): void => {};

  onOptionSelect(option: SelectOption): void {
    this.selectedValue.set(option.value);
    this._onChange(option.value);
    this._onTouched();
    this.valueChange.emit(option.value);
  }

  writeValue(value: string | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
}
