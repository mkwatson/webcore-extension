# ESLint and TypeScript Configuration Guide

This document provides a comprehensive guide to our ESLint and TypeScript setup, including challenges we've encountered and solutions implemented.

## Configuration Overview

We've implemented a package-type-specific ESLint configuration approach that separates configurations based on package purpose (React vs Node). This eliminates warnings and ensures appropriate rules are applied to each package.

### Structure

- `eslintrc.base.js` - Common rules for all packages
- `eslintrc.react.js` - React-specific rules (extends base)
- `eslintrc.node.js` - Node-specific rules (extends base)
- Package-specific `.eslintrc.js` files that extend the appropriate config

### Root Configuration

The root `.eslintrc.json` simply extends the base configuration:

```json
{
  "root": true,
  "extends": "./eslintrc.base.js"
}
```

### Package-Specific Configurations

Each package has its own `.eslintrc.js` that extends the appropriate configuration:

```js
// packages/extension/.eslintrc.js
module.exports = {
  extends: ['../../eslintrc.react.js'],
  env: {
    browser: true,
    webextensions: true,
  },
}

// packages/backend/.eslintrc.js and packages/shared/.eslintrc.js
module.exports = {
  extends: ['../../eslintrc.node.js'],
}
```

## Previous Challenges (Resolved)

### 1. React Plugin Warnings in Non-React Packages

**Issue:** When running `pnpm lint`, warnings appeared in the `shared` and `backend` packages about React version detection.

**Solution:** Implemented package-type-specific configs to ensure React settings are only applied to the extension package.

### 2. TypeScript Version Compatibility

**Issue:** Our project uses TypeScript 5.8.3, which is newer than the version officially supported by `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` (v7.x).

**Solution:**

1. Switched from `@ts-expect-error` to standard ESLint inline disable comments
2. Created a more robust ESLint configuration structure

### 3. Husky Pre-commit Hook Deprecation

**Issue:** Husky showed deprecation warnings about outdated syntax in the pre-commit hook.

**Solution:** Updated the `.husky/pre-commit` file to use the new recommended syntax:

```bash
#!/bin/sh
pnpm lint-staged --config .lintstagedrc.json
```

## Development Environment Notes

During development, we encountered issues where automated tools (like AI assistants or code generators) would report successful edits to files (showing correct diffs in results), but the changes weren't actually being applied to the disk.

### Symptoms

- Linting errors persisted despite "fixed" files
- Inconsistency between tool output and actual file content

### Solutions

- Manual verification of file changes by checking content directly
- Running linters again after automated edits
- Direct manual edits when necessary

### Helpful Diagnostic Commands

```bash
# Run linter on specific files to check for issues
pnpm lint

# Directly verify file content with specific line numbers
sed -n '115,120p' packages/backend/api/chat.test.ts

# Check staged files before commit
git diff --staged
```

## Future Tooling Improvements

- **Update TypeScript ESLint Packages:** Periodically update `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` as they improve compatibility with newer TypeScript releases.

- **Stricter Mock Typing:** Consider stricter typing for mocks when the tooling ecosystem better supports complex async stream types.

- **Test-Specific ESLint Config:** Consider creating a more specialized ESLint configuration for test files that allows certain patterns needed for testing but unwanted in production code.

## Special Case: Typescript-ESLint and @ts-expect-error

As noted in the README, we encountered specific issues with `@ts-expect-error` comments in our test files:

1. These directives were sometimes flagged as "unused" despite being necessary
2. This caused lint failures in CI

Our solution was to replace `@ts-expect-error` with standard ESLint inline disable comments:

```typescript
// Instead of:
// @ts-expect-error AsyncIterable<any> typing
const mockStream: AsyncIterable<any> = { ... };

// We now use:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStream: AsyncIterable<any> = { ... };
```

This approach proved more reliable with our current tooling configuration.
