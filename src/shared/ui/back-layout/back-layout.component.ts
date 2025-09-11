import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-back-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton, TuiIcon],
  templateUrl: './back-layout.component.html',
  styleUrl: './back-layout.component.scss',
})
export class BackLayoutComponent {
  readonly backLink = input<string>('/dashboard');
  readonly title = input<string>('');

  private readonly router = inject(Router);

  onBackClick(): void {
    void this.router.navigate([this.backLink()]);
  }
}
