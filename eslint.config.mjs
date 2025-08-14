// eslint.config.mjs
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import boundariesPlugin from 'eslint-plugin-boundaries';

// __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      boundaries: boundariesPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: join(__dirname, 'tsconfig.json')
        },
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'pages', pattern: 'src/pages/**', capture: ['page'] },
        { type: 'widgets', pattern: 'src/widgets/**', capture: ['widget'] },
        { type: 'features', pattern: 'src/features/**', capture: ['feature'] },
        { type: 'entities', pattern: 'src/entities/**', capture: ['entity'] },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
      'boundaries/ignore': ['**/*.spec.ts', '**/*.stories.ts'],
    },
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // Console
      'no-console': ['error', { allow: ['error'] }],

      // Angular specific
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' }
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' }
      ],

      // TypeScript
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } }
      ],

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type'
          ],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: 'src/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.spec.ts',
            '**/karma.conf.*',
            '**/test/**',
            '**/*.config.*',
            '**/*.conf.*',
            'eslint.config.mjs'
          ]
        }
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' }
      ],
      'import/newline-after-import': ['error', { count: 1 }],
      'import/no-default-export': 'error',

      // Array formatting (отключены для prettier)
      'array-element-newline': 'off',
      'array-bracket-newline': 'off',

      // Boundaries rules - FSD Architecture
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: '${file.type} is not allowed to import ${dependency.type}',
          rules: [
            // app может импортировать все нижележащие слои
            {
              from: ['app'],
              allow: ['pages', 'widgets', 'features', 'entities', 'shared'],
              message: 'App layer can import from any lower layer'
            },
            // pages может импортировать widgets, features, entities, shared
            {
              from: ['pages'],
              allow: ['widgets', 'features', 'entities', 'shared'],
              message: 'Pages can only import from widgets, features, entities, and shared layers'
            },
            // widgets может импортировать features, entities, shared
            {
              from: ['widgets'],
              allow: ['features', 'entities', 'shared'],
              message: 'Widgets can only import from features, entities, and shared layers'
            },
            // features может импортировать только entities и shared
            {
              from: ['features'],
              allow: ['entities', 'shared'],
              message: 'Features can only import from entities and shared layers'
            },
            // entities может импортировать только shared
            {
              from: ['entities'],
              allow: ['shared'],
              message: 'Entities can only import from shared layer'
            },
            // shared может импортировать только shared
            {
              from: ['shared'],
              allow: ['shared'],
              message: 'Shared can only import from shared layer'
            },
          ],
        }
      ],
      // Запрет импорта других слайсов того же уровня (кроме shared)
      'boundaries/no-private': [
        'error',
        {
          allowUncles: false,
          message: 'Private import of ${dependency.specifier} is not allowed. Use public API instead.',
        }
      ],
      // Публичный API через index.ts
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message: 'Import from ${dependency.specifier} is not allowed. Use public API (index.ts) instead.',
          rules: [
            // Разрешаем импорт через index.ts для всех слоев кроме app
            {
              target: ['pages', 'widgets', 'features', 'entities'],
              allow: '**/index.ts'
            },
            // Для shared разрешаем прямые импорты
            {
              target: ['shared'],
              allow: '**'
            },
            // Для app разрешаем все (это корень приложения)
            {
              target: ['app'],
              allow: '**'
            }
          ]
        }
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/use-track-by-function': 'error',
      '@angular-eslint/template/conditional-complexity': ['error', { maxComplexity: 4 }],
      '@angular-eslint/template/cyclomatic-complexity': ['error', { maxComplexity: 4 }],
    },
  }
);
