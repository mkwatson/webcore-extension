const { FlatCompat } = require('@eslint/eslintrc');
const eslint = require('@eslint/js');

const compat = new FlatCompat();

module.exports = [
  eslint.configs.recommended,
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier'
  ),
  {
    // Config for JavaScript files (Node environment)
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    // Config for TypeScript files
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Config for test files
    files: ['**/tests/**/*.{ts,tsx,js}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Ignore patterns
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
]; 