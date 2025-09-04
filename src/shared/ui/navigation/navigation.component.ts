import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

import { ThemeService } from '@/shared';

interface NavigationItem {
  route: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TuiButton, TuiIcon],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  private readonly themeService = inject(ThemeService);

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

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public isDark(): boolean {
    return this.themeService.isDark();
  }
}
