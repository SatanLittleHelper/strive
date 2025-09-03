import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuiTabs } from '@taiga-ui/kit';

export interface StepConfig {
  title: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-step-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiTabs],
  templateUrl: './step-navigation.component.html',
  styleUrl: './step-navigation.component.scss',
})
export class StepNavigationComponent {
  readonly steps = input.required<StepConfig[]>();
  readonly activeStepIndex = input.required<number>();
  readonly stepClick = output<number>();

  onStepClick(index: number): void {
    this.stepClick.emit(index);
  }
}
