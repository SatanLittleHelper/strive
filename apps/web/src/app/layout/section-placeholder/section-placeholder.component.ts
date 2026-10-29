import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-section-placeholder',
  templateUrl: './section-placeholder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SectionPlaceholderComponent {
  protected readonly heading = inject(ActivatedRoute).snapshot.data['heading'] as string;
}
