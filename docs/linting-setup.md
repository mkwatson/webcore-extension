# ESLint and TypeScript Configuration Guide

This document provides a comprehensive guide to our ESLint and TypeScript setup, including challenges we've encountered and solutions implemented.

## Current Challenges

### 1. React Plugin Warnings in Non-React Packages

**Issue:** When running `pnpm lint`, the following warning appears in the `shared` and `backend` packages:

```
Warning: React version was set to "detect" in eslint-plugin-react settings, but the "react" package is not installed. Assuming latest React version.
```

This occurs because our root ESLint configuration includes React plugin settings, but these packages don't use React.

### 2. TypeScript Version Compatibility

**Issue:** Our project uses TypeScript 5.8.3, which is newer than the version officially supported by `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` (v7.x). This version mismatch can cause subtle linting issues, particularly with directives like `@ts-expect-error`.

## Recommended Solution: Package-Type-Specific Configs

The most robust and maintainable approach is to create separate base ESLint configurations for different package types:

### Implementation Steps

1. Create base config files:

```js
// eslintrc.base.js - Common rules for all packages
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    // Common rules here
  }
};

// eslintrc.react.js - React-specific rules
module.exports = {
  extends: ['./eslintrc.base.js', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // React-specific rules
  }
};

// eslintrc.node.js - Node-specific rules
module.exports = {
  extends: ['./eslintrc.base.js'],
  env: {
    node: true
  },
  rules: {
    // Node-specific rules
  }
};
```

2. Update package-specific ESLint configurations:

```js
// packages/extension/.eslintrc.js
module.exports = {
  extends: '../../eslintrc.react.js'
};

// packages/backend/.eslintrc.js
module.exports = {
  extends: '../../eslintrc.node.js'
};

// packages/shared/.eslintrc.js
module.exports = {
  extends: '../../eslintrc.node.js'
};
```

### Benefits of This Approach

1. **Separation of Concerns:** Different package types have clear, separate configurations
2. **Scalability:** Easily accommodates future packages without duplication
3. **Maintainability:** When React updates or ESLint rules change, you only update one config file
4. **Clarity:** Makes it explicit which packages use React and which don't
5. **Industry Standard:** This is a common pattern in large monorepos

## Alternative Solutions

### Option 1: Install React as Dev Dependency

```bash
pnpm --filter @webcore/backend add -D react
pnpm --filter @webcore/shared add -D react
```

**Pros:** Simple fix, keeps configuration consistent
**Cons:** Unnecessary dependencies, misleading dependency graph

### Option 2: Disable React Plugin in Non-React Packages

Create package-specific `.eslintrc.js` files that remove React settings.

**Pros:** No unnecessary dependencies
**Cons:** Duplicate configuration, maintenance overhead

### Option 3: Use ESLint Overrides Based on Patterns

Use path-based overrides in the root config.

**Pros:** Single configuration file
**Cons:** Complex, harder to debug

### Option 4: Use Environment-Specific Settings

Configure based on runtime environment.

**Pros:** Works with mixed packages
**Cons:** Doesn't directly solve the warning, more complex

## Development Environment Notes

During development, we encountered issues where automated tools (like AI assistants or code generators) would report successful edits to files (showing correct diffs in results), but the changes weren't actually being applied to the disk.

### Symptoms
- Linting errors persisted despite "fixed" files
- Inconsistency between tool output and actual file content

### Solutions
- Manual verification of file changes by checking content directly
- Running linters again after automated edits
- Direct manual edits when necessary

### Root Causes
- Tool permission limitations
- File locking by other processes
- Caching issues in the tools themselves

### Helpful Diagnostic Commands

```bash
# Run linter on specific files to check for issues
pnpm lint

# Directly verify file content with specific line numbers
sed -n '115,120p' packages/backend/api/chat.test.ts

# Check staged files before commit
git diff --staged

# If lint/commit hooks fail, examine the exact errors
git commit -m "Test commit" || echo "Failed, see errors above"

# If desperate, bypass lint checks temporarily to capture changes
# (Use sparingly and fix lint issues in followup commit)
git commit --no-verify -m "Bypass lint checks - FIXME" 
```

## Future Tooling Improvements

- **Update TypeScript ESLint Packages:** Periodically update `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` as they improve compatibility with newer TypeScript releases.

- **Stricter Mock Typing:** Consider stricter typing for mocks when the tooling ecosystem better supports complex async stream types.

- **TypeScript Configuration Review:** Regularly revisit TypeScript configuration to ensure compatibility with the latest ESLint plugins.

- **Test-Specific ESLint Config:** Consider creating a more specialized ESLint configuration for test files that allows certain patterns needed for testing but unwanted in production code.

- **CI Checks:** Add specific CI checks for linting issues to catch problems early.

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