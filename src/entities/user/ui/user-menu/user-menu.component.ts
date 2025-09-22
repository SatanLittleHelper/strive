import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
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

  protected readonly userDropdownOpen = signal(false);
  protected open = false;

  readonly logout = output<void>();

  protected readonly toggleTheme = (): void => {
    this.themeService.toggleTheme();
    this.userDropdownOpen.set(false);
  };

  protected readonly onLogout = (): void => {
    this.logout.emit();
    this.userDropdownOpen.set(false);
  };

  protected readonly isDark = this.themeService.isDark;
  protected readonly user = this.userStore.user;
}
