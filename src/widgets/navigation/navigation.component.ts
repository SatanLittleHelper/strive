import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

import { UserMenuComponent } from '@/entities/user';
import { AuthService } from '@/features/auth';
import { UserStoreService } from '@/shared';

interface NavigationItem {
  route: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, TuiButton, TuiIcon, UserMenuComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  private readonly userStore = inject(UserStoreService);
  private readonly authService = inject(AuthService);

  protected readonly navigationItems: NavigationItem[] = [
    {
      route: '/dashboard',
      label: 'Dashboard',
      icon: '@tui.home',
    },
    {
      route: '/calorie-calculator',
      label: 'Calculator',
      icon: '@tui.bar-chart',
    },
  ];

  protected readonly isAuthenticated = this.userStore.isAuthenticated;
  protected readonly user = this.userStore.user;

  protected readonly onLogout = (): void => {
    this.authService.logout();
  };
}
