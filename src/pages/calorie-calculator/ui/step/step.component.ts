import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './step.component.html',
  styleUrl: './step.component.scss',
})
export class StepComponent {
  readonly title = input.required<string>();
}
