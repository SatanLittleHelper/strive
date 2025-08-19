import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  public readonly variant = input<ButtonVariant>('primary');
  public readonly size = input<ButtonSize>('md');
  public readonly disabled = input<boolean>(false);

  public buttonClass(): string {
    const variantClass: string = `btn-variant-${this.variant()}`;
    const sizeClass: string = `btn-size-${this.size()}`;
    return `button ${variantClass} ${sizeClass}`;
  }
}
