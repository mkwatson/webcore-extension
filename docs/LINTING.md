# Code Quality Tools

This project uses ESLint and Prettier to maintain code quality and consistent styling.

## ESLint

ESLint is configured to enforce good practices for TypeScript development.

### Usage

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically (when possible)
npm run lint:fix
```

### Configuration

- We use ESLint v9 with the new flat config system (eslint.config.js)
- Different rules are applied for JavaScript, TypeScript, and test files
- Node.js globals are properly handled in script files
- Console usage is restricted in TypeScript files (only console.warn and console.error are allowed)

## Prettier

Prettier ensures consistent code formatting across the project.

### Usage

```bash
# Format all supported files
npm run format
```

## Pre-commit Hooks

Lint-staged is configured to run automatically on staged files before each commit via Husky.
This ensures all committed code meets the project's quality standards.

## VS Code Integration

For the best development experience, install the recommended VS Code extensions:

1. ESLint (`dbaeumer.vscode-eslint`)
2. Prettier (`esbenp.prettier-vscode`)

The workspace has been configured to:
- Format files on save
- Run ESLint fixes on save
- Use consistent line endings

## Configuration Files

- `eslint.config.js` - ESLint configuration
- `.prettierrc.js` - Prettier configuration
- `.lintstagedrc.js` - Lint-staged configuration
- `.vscode/settings.json` - VS Code editor settings 