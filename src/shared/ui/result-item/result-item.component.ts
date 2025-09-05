import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultItemComponent {
  label = input.required<string>();
  value = input.required<string>();
  description = input.required<string>();
  isHighlighted = input<boolean>(false);
}
