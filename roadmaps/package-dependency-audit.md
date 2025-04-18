> **Note**: This document is maintained for historical context. The authoritative implementation plan is now in [cross-package-dependency-resolution-plan.md](./cross-package-dependency-resolution-plan.md).

# Cross-Package Dependency Audit

This document tracks all cross-package dependencies in the webcore-extension monorepo. It helps identify potential coupling issues and guides our architecture improvements.

## Current Dependencies

### @webcore/shared

**Exports:**

- `messaging-types.ts`: Shared type definitions for messaging between packages

**Imported by:**

- `@webcore/backend`: For API request/response typing
- `@webcore/extension`: For messaging between browser components

### @webcore/backend

**Imports from @webcore/shared:**

- `messaging-types.ts`: Chat message and content types

**Import paths used:**

- Relative imports: `../../shared/src/messaging-types`

**Files with imports:**

- `api/chat.ts`
- `api/chat.test.ts`
- `api/test-imports.ts`
- `src/utils/messageUtils.ts`
- `src/utils/messageUtils.test.ts`

### @webcore/extension

**Imports from @webcore/shared:**

- `messaging-types.ts`: Chat message and content types

**Import paths used:**

- Path alias: `@webcore/shared/messaging-types`

**Files with imports:**

- `src/background/messages/callApi.ts`
- `src/background/callApiStream.ts` (commented out)
- `src/components/MessageList.tsx`
- `src/components/MessageList.test.tsx`
- `src/sidepanel.test.tsx`

## Import Strategy Issues

### Inconsistency

- The backend package uses relative imports (`../../shared/src/messaging-types`)
- The extension package uses path aliases (`@webcore/shared/messaging-types`)

### TypeScript Configuration

- Backend package needed `rootDirs` configuration to handle imports outside its directory
- Extension package uses tsconfig path aliases

## Recommendations

1. **Standardize Import Approach**

   - Either use path aliases consistently across all packages
   - Or use relative imports consistently across all packages

2. **Improve Package Boundaries**

   - Create proper entry points in the shared package
   - Use proper exports in package.json
   - Consider exporting both CommonJS and ESM versions

3. **Type-Only Imports**
   - For type-only dependencies, use explicit `import type` syntax
   - This prevents runtime dependencies on type-only imports

## Next Steps

1. Create consistent type export patterns in shared package
2. Document and enforce import conventions
3. Update build system to properly handle cross-package builds
