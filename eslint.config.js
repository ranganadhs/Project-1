const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettier,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'ios/**',
      'android/**',
      'expo-env.d.ts',
      // Vendored third-party agent skills; their scripts are not this repo's code.
      '.claude/**',
      '.agents/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // Tier 1 is where literals legitimately live — it is the definition of the
    // scales everything else must reference.
    ignores: ['src/theme/tokens/**', 'src/theme/themes/color-*.ts'],
    plugins: {
      local: {
        rules: { 'no-raw-style-values': require('./eslint-rules/no-raw-style-values') },
      },
    },
    rules: { 'local/no-raw-style-values': 'error' },
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@react-navigation/*'],
              message:
                'Since SDK 56, import from expo-router/react-navigation instead. ' +
                'Direct @react-navigation imports break the router.',
            },
          ],
        },
      ],
    },
  },
];
