# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Strive** is a modern Angular 19 application built as a Telegram Web App for fitness/workout management. The project uses TypeScript with standalone components, zoneless change detection, and implements Feature-Sliced Design (FSD) architecture.

## Development Commands

```bash
# Development
npm start              # Start development server
npm run build          # Production build
npm run watch          # Development build with watch mode
npm test               # Run unit tests (Jasmine/Karma)

# Code Quality
npm run lint           # Run both TypeScript and SCSS linting
npm run lint:ts        # TypeScript/Angular linting with --fix
npm run lint:styles    # SCSS linting with --fix
npm run format         # Format code with Prettier
```

## Architecture

### Feature-Sliced Design (FSD)
The project strictly enforces FSD architecture with ESLint boundaries plugin:

- `/src/app/` - Application entry point, routing, and providers
- `/src/pages/` - Page-level components (route components)
- `/src/widgets/` - Complex UI blocks and composite components
- `/src/features/` - Business logic features (reusable across pages)
- `/src/entities/` - Business entities and domain models
- `/src/shared/` - Shared utilities, services, UI components, and libraries

Import restrictions between layers are enforced - higher layers can import from lower layers but not vice versa.

### Key Technical Decisions
- **Standalone Components**: No NgModules, everything is standalone
- **Zoneless Change Detection**: Uses `provideExperimentalZonelessChangeDetection()`
- **Signals**: Primary state management approach with `computed()` for derived state
- **OnPush Strategy**: Default change detection strategy for performance
- **Path Aliases**: `@/*` maps to `src/*`

## Technology Stack

- **Angular 19.2.0** with Angular CLI
- **TypeScript 5.7.2** with strict mode enabled
- **Taiga UI 4.49.0** - Primary UI component library
- **SCSS** with modular architecture and design tokens
- **PWA** support with Service Worker

## Coding Conventions

### Angular Patterns
- Use `inject()` function for dependency injection (not constructor injection)
- Use `input()` and `output()` functions instead of decorators
- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Prefer `computed()` for derived state over getters
- Always specify OnPush change detection strategy
- Use signals for reactive state management

### Component Architecture
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton],
  template: `...`
})
export class ExampleComponent {
  private readonly service = inject(ExampleService);
  
  readonly inputData = input.required<string>();
  readonly optionalInput = input(false);
  readonly dataChanged = output<string>();
  
  readonly computedValue = computed(() => 
    this.inputData().toUpperCase()
  );
}
```

## Styling System

### SCSS Architecture
- `/src/shared/lib/variables.scss` - CSS custom properties and design tokens
- `/src/shared/lib/reset.scss` - CSS reset
- `/src/shared/lib/typography.scss` - Typography scale
- `/src/shared/lib/taiga-theme.scss` - Taiga UI theme customization
- Use `@use` instead of `@import` for SCSS modules

### Design Tokens
The project uses HSL-based color tokens with automatic light/dark theme support:
- Colors: `--color-primary-hsl`, `--color-accent-hsl`, etc.
- Typography: `--font-size-xs` to `--font-size-xl`
- Spacing: `--space-xs` to `--space-xl`
- Borders: `--border-radius-sm`, `--border-radius-md`, etc.

### Theme Service
Use `ThemeService` for programmatic theme switching:
```typescript
private readonly themeService = inject(ThemeService);

toggleTheme() {
  this.themeService.toggleTheme();
}
```

## Testing

- **Framework**: Jasmine + Karma
- **Current State**: Minimal test coverage (only app.component.spec.ts exists)
- **Run Tests**: `npm test`
- When adding features, create corresponding `.spec.ts` files

## Code Quality Tools

- **ESLint**: Configured with Angular, TypeScript, and FSD boundaries rules
- **Prettier**: Automatic code formatting
- **Stylelint**: SCSS linting
- **Husky + lint-staged**: Pre-commit hooks ensure code quality
- **Strict TypeScript**: Explicit return types required for functions

## Telegram Web App Integration

The app initializes Telegram Web App functionality via:
```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const telegramService = inject(TelegramService);
        return () => telegramService.ready();
      },
      multi: true
    }
  ]
};
```

Access Telegram features through `TelegramService` in `/src/shared/services/telegram/`.

## Important Files

- `/angular.json` - Angular CLI configuration with Taiga UI styles
- `/tsconfig.json` - TypeScript configuration with path aliases
- `/eslint.config.mjs` - ESLint configuration with FSD boundaries
- `/src/app/app.config.ts` - Application providers and configuration
- `/src/app/app.routes.ts` - Routing configuration
- `/src/styles.scss` - Main stylesheet importing design system

## Development Notes

- All routes currently redirect to `/dashboard`
- The project uses zoneless change detection (experimental Angular feature)
- PWA service worker is configured in `/ngsw-config.json`
- Main color palette can be adjusted in `/src/shared/lib/variables.scss`
- Taiga UI components are imported individually for better tree-shaking