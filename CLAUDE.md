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
- **Template Files**: Always use separate `.html` files for component templates (never inline templates)
- Components must have corresponding `.html`, `.ts`, and `.scss` files

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
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
- add to memory используй бэм для верстки и цсс

## Routing Standards

### Route Naming Convention

All route constants must use **UPPER_SNAKE_CASE** naming:

```typescript
// ✅ Correct - UPPER_SNAKE_CASE
export const DASHBOARD_ROUTES: Route[] = [...];
export const CALORIE_CALCULATOR_ROUTES: Routes = [...];

// ❌ Wrong - camelCase
export const dashboardRoutes: Route[] = [...];
export const calorieCalculatorRoutes: Routes = [...];
```

### Route File Structure

Every page must follow this pattern:
```
src/pages/[page-name]/
├── [page-name].routes.ts     # Route definitions with UPPER_SNAKE_CASE exports
├── index.ts                  # Public API exports
└── ui/                       # Page components
```

### Key Rules:
- **Route constants**: UPPER_SNAKE_CASE (e.g., `DASHBOARD_ROUTES`)
- **Route files**: kebab-case (e.g., `dashboard.routes.ts`)
- **Route paths**: kebab-case (e.g., `'calorie-calculator'`)
- **Component names**: PascalCase (e.g., `DashboardComponent`)
- **Always include `title`** property for better UX

For detailed routing rules, see `.cursor/rules/project-structure.mdc`.

## PWA Icons Management

The project includes a comprehensive PWA icon generation system:

### Icon Generation Script
- **Command**: `npm run generate:icons`
- **Source**: `public/icons/logo.svg`
- **Output**: Multiple PNG icons for different devices and platforms
- **Script**: `scripts/generate-pwa-icons.cjs`

### Generated Icons
- Favicon (32x32)
- iOS icons (120x120, 152x152, 167x167, 180x180)
- Android icons (72x72, 96x96, 128x128, 144x144, 192x192, 256x256, 384x384, 512x512)
- Maskable icon for Android adaptive icons (512x512 with padding)

### How to Update Icons
1. Replace `public/icons/logo.svg` with your logo
2. Run `npm run generate:icons`
3. Test on real devices
4. Commit the generated icons

For detailed instructions, see [PWA Icons Guide](docs/PWA-ICONS.md).

## Taiga UI Best Practices

### Select Components with Computed Signals

For optimal performance when using Taiga UI Select components, use computed signals with pre-formatted display text:

```typescript
// ✅ Recommended approach
@Component({
  // ...
})
export class ExampleComponent {
  // Computed signal for options with displayText
  protected readonly options = computed(() =>
    generateSelectOptions(SourceObject).map(option => ({
      ...option,
      displayText: stringifySelectOptionByValue(generateSelectOptions(SourceObject), option.value)
    }))
  );

  // Function for [stringify] on tui-textfield
  protected readonly stringifyOption = (item: string): string =>
    stringifySelectOptionByValue(generateSelectOptions(SourceObject), item);
}
```

```html
<!-- ✅ Recommended template structure -->
<tui-textfield tuiChevron [stringify]="stringifyOption">
  <input tuiSelect formControlName="fieldName" />
  <tui-data-list *tuiTextfieldDropdown>
    @for (item of options(); track item.value) {
      <button new tuiOption type="button" [value]="item.value">
        {{ item.displayText }}
      </button>
    }
  </tui-data-list>
</tui-textfield>
```

**Key Benefits:**
- **Performance**: Computed signals cache results and only recalculate when dependencies change
- **Consistency**: Same formatting logic applied everywhere
- **No redundant calls**: Functions aren't called repeatedly during rendering
- **Maintainability**: Centralized formatting logic

**Important Notes:**
- Use `[stringify]="function"` on `tui-textfield` for selected value formatting
- Use `{{ item.displayText }}` in options for pre-formatted text display
- Use `tui-data-list` with `@for` loop instead of `tui-data-list-wrapper` with `[items]`
- Pass `[value]="item.value"` to send only the value to the form

For detailed Taiga UI usage rules, see `.cursor/rules/taiga-ui.mdc`.