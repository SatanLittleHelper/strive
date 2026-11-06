import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiTitle } from '@taiga-ui/core';
import { RingComponent } from '../ring';
import type { EditorSet } from '../session-view.types';
import {
  FULL_RING_VALUE,
  NO_WEIGHT_TEXT,
  REPS_RING_COLOR,
  WEIGHT_RING_COLOR,
} from './set-rings.constants';

@Component({
  selector: 'app-set-rings',
  imports: [RingComponent, TuiTitle],
  templateUrl: './set-rings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-3 gap-2' },
})
export class SetRingsComponent {
  readonly reps = input.required<number>();
  readonly weight = input.required<number | null>();
  readonly plannedSets = input.required<number>();
  readonly savedCount = input.required<number>();
  readonly ringMax = input.required<number>();
  readonly editorSet = input.required<EditorSet>();

  protected readonly fullValue = FULL_RING_VALUE;
  protected readonly repsColor = REPS_RING_COLOR;
  protected readonly weightColor = WEIGHT_RING_COLOR;

  protected readonly weightText = computed(() => {
    const weight = this.weight();

    return weight === null ? NO_WEIGHT_TEXT : String(weight);
  });
  protected readonly repsLabel = computed(() => `Повторы: цель ${this.reps()}`);
  protected readonly weightLabel = computed(() => {
    const weight = this.weight();

    return weight === null ? 'Вес: цель не задана' : `Вес: цель ${weight} кг`;
  });
  protected readonly setsLabel = computed(
    () => `Выполнено ${this.savedCount()} из ${this.plannedSets()} подходов`,
  );
  protected readonly setsText = computed(() => `${this.savedCount()}/${this.plannedSets()}`);
  protected readonly caption = computed(() => {
    const { mode, setNumber } = this.editorSet();
    if (mode === 'none') return 'готово';

    return mode === 'edit' ? `правка ${setNumber}` : `подход ${setNumber}`;
  });
}
