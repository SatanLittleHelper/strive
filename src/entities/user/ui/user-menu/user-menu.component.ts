import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { TuiButton, TuiIcon, TuiDropdown } from '@taiga-ui/core';

import { ThemeService, UserStoreService } from '@/shared';

@Component({
  selector: 'app-user-menu',
  imports: [TuiButton, TuiIcon, TuiDropdown],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  private readonly themeService = inject(ThemeService);
  private readonly userStore = inject(UserStoreService);

  protected open = false;

  readonly logout = output<void>();

  protected readonly toggleTheme = (): void => {
    this.open = false;
    this.themeService.toggleTheme();
  };

  protected readonly onLogout = (): void => {
    this.logout.emit();
    this.open = false;
  };

  protected readonly isDark = this.themeService.isDark;
  protected readonly user = this.userStore.user;
}
