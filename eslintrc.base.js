module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'ignoreRestSiblings': true 
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error'
  },
  ignorePatterns: ['dist', 'node_modules', '.turbo', 'coverage'],
  overrides: [
    {
      // Root-level config files
      files: [
        './*.js', // Match *.js files directly in the root
        './*.config.js', // Match *.config.js files directly in the root
        './*.mjs'
      ],
      env: {
        node: true,
        commonjs: true
      },
      parserOptions: { // Ensure parser options are set if needed
        ecmaVersion: 2020
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off' // Allow require in these JS files
      }
    },
    {
      // TypeScript/TSX in each package
      files: [
        'packages/shared/**/*.{ts,tsx}',
        'packages/backend/**/*.ts',
        'packages/extension/**/*.{ts,tsx}'
      ],
      env: {
        browser: true,
        node: false,
        es2021: true
      },
      parserOptions: {
        project: './tsconfig.base.json',
        tsconfigRootDir: __dirname
      }
    },
    {
      // Plain JS tools scripts
      files: ['tools/**/*.js'],
      env: {
        node: true,
        commonjs: true,
        es2020: true
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script'
      },
      extends: ['eslint:recommended'],
      rules: {
        // allow require()
        '@typescript-eslint/no-var-requires': 'off',
        // Disable both TS and core JS unused vars rules for tools scripts
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
}; 