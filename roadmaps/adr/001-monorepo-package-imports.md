# ADR 001: Monorepo Cross-Package Import Strategy

## Status

Proposed

## Context

In our webcore-extension monorepo, we have multiple packages (`@webcore/shared`, `@webcore/backend`, `@webcore/extension`) that depend on each other. We've encountered issues with TypeScript imports between packages, particularly when using Vercel's development server.

Specifically:

1. The backend package imports types from the shared package
2. TypeScript compilation during `vercel dev` shows errors despite the code running correctly
3. Different import strategies (`relative imports` vs `path aliases`) behave differently across environments

We need a consistent, reliable approach to managing cross-package dependencies.

## Decision Drivers

- Need for consistent behavior across development environments
- TypeScript compilation correctness
- Runtime module resolution
- Developer experience and clear error messages
- Build performance and reliability
- Compatibility with our deployment platforms (Vercel)

## Considered Options

1. **Relative Imports**: Using relative paths (e.g., `import from '../../shared/src/types'`)
2. **Path Aliases**: Using TypeScript path mappings (e.g., `import from '@webcore/shared/types'`)
3. **Package Boundaries with Proper Exports**: Publishing internal packages with proper entry points
4. **Bundling Shared Code**: Copying/bundling shared code into consuming packages
5. **Proper Monorepo Build System**: Implementing a tool like Turborepo

## Decision

We are implementing a multi-phase approach:

1. **Short term**: Use relative imports with proper TypeScript configuration

   ```json
   // packages/backend/tsconfig.json
   {
     "compilerOptions": {
       "rootDirs": [".", "../shared/src"],
       "include": ["./**/*", "../shared/src/**/*"]
     }
   }
   ```

2. **Medium term**: Implement a proper monorepo build system (Turborepo) to handle cross-package dependencies automatically.

3. **Long term**: Establish clean package boundaries with proper exports and interfaces.

## Consequences

### Positive

- Immediate resolution of TypeScript compilation errors
- Consistent behavior across environments
- Better developer experience with fewer confusing errors
- Foundation for future improvements

### Negative

- Temporary solution increases coupling between packages
- Relative imports are more fragile when files are moved
- May require additional build steps in some environments

### Neutral

- Will require updates to documentation
- Developers need to be aware of the current import strategy

## Implementation

1. Updated TypeScript configuration in backend package to include shared code
2. Maintained relative imports in backend code
3. Created documentation of the approach
4. Added a plan for migrating to a more robust solution

## Notes

This decision will be revisited after implementing the monorepo build system to evaluate if a different import strategy would be more beneficial in the new architecture.
