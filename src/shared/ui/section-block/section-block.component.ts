import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-block.component.html',
  styleUrl: './section-block.component.scss',
})
export class SectionBlockComponent {
  readonly title = input<string | undefined>(undefined);
}
