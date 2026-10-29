import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/generated/**',
      'node_modules/**',
      'tmp/**',
      '.nx/**',
      'coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '.claude/**',
      '.agents/**',
    ],
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['apps/web/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
  },
  {
    files: ['apps/web/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  { files: ['**/*.ts'], rules: { '@typescript-eslint/no-non-null-assertion': 'error' } },
  prettier,
);
