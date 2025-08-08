module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-clean-order',
  ],
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-scss', 'stylelint-order'],
  rules: {
    'no-empty-source': null,
    'color-hex-length': 'short',
    'selector-class-pattern': [
      '^[a-z][a-z0-9\\-]*$',
      {
        message: 'Expected class selector to be kebab-case',
      },
    ],
  },
};


