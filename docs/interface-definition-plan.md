> **Note**: This document is maintained for historical context. The authoritative implementation plan is now in [roadmaps/cross-package-dependency-resolution-plan.md](../roadmaps/cross-package-dependency-resolution-plan.md).

# Interface Definition Plan for WebCore Monorepo

This document outlines the implementation plan for establishing clear and consistent interfaces between packages in the WebCore monorepo.

## Current Situation

### Package Structure

- **shared**: Contains common types and constants used by other packages
  - `messaging-types.ts`: Defines interfaces for messaging between extension components
  - `index.ts`: Re-exports from messaging-types and defines a few simple types/constants
- **extension**: Browser extension package using Plasmo framework
  - Uses path alias imports: `@webcore/shared/messaging-types`
  - Configured in tsconfig.json with path mappings
- **backend**: Serverless API functions
  - Uses relative imports: `../../shared/src/messaging-types`
  - Configured with rootDirs to handle imports outside its directory

### Import Inconsistencies

1. **Extension Package**: Uses TypeScript path aliases

   - Pattern: `import type { ChatMessage } from "@webcore/shared/messaging-types"`
   - Configured in tsconfig.json with paths mapping
   - Works with Plasmo/Parcel build environment

2. **Backend Package**: Uses relative imports

   - Pattern: `import type { ChatMessage } from "../../shared/src/messaging-types"`
   - Vercel configuration includes shared files in the build

3. **Compile-time vs Runtime**:
   - Most shared imports are TypeScript types (compile-time only)
   - Few runtime dependencies (only the SHARED_CONSTANT)
   - No actual shared runtime logic currently exists

## Implementation Plan

### 1. Standardize Shared Package Structure

1. **Create proper submodule structure:**

   ```
   packages/shared/
     ├── src/
     │   ├── index.ts           # Main entry point
     │   ├── types/             # Type definitions
     │   │   ├── index.ts       # Re-exports all types
     │   │   ├── messaging.ts   # Renamed from messaging-types.ts
     │   │   └── models.ts      # Other type definitions
     │   ├── constants/         # Runtime constants
     │   │   ├── index.ts       # Re-exports all constants
     │   │   └── common.ts      # Shared constants
   ```

2. **Define clear entry points:**
   - Main entry point: `@webcore/shared`
   - Type-only entry point: `@webcore/shared/types`
   - Constants entry point: `@webcore/shared/constants`

### 2. Implement Explicit Type Imports

1. **Use `import type` for type-only dependencies:**

   ```typescript
   // Before
   import { ChatMessage } from '@webcore/shared/messaging-types'

   // After
   import type { ChatMessage } from '@webcore/shared/types/messaging'
   ```

2. **Use normal imports for runtime dependencies:**
   ```typescript
   // For runtime constants
   import { SHARED_CONSTANT } from '@webcore/shared/constants'
   ```

### 3. Standardize Import Approach

Based on the investigation, we'll adopt **path aliases consistently** across all packages:

1. **Update backend tsconfig.json:**

   ```json
   {
     "compilerOptions": {
       "paths": {
         "@webcore/shared/*": ["../shared/src/*"]
       }
     }
   }
   ```

2. **Update all backend imports:**

   ```typescript
   // Before
   import type { ChatMessage } from '../../shared/src/messaging-types'

   // After
   import type { ChatMessage } from '@webcore/shared/types/messaging'
   ```

3. **Update extension imports:**

   ```typescript
   // Before
   import type { ChatMessage } from '@webcore/shared/messaging-types'

   // After
   import type { ChatMessage } from '@webcore/shared/types/messaging'
   ```

### 4. Update Build Configuration

1. **Update shared package.json exports:**

   ```json
   {
     "exports": {
       ".": "./dist/index.js",
       "./types": "./dist/types/index.js",
       "./types/*": "./dist/types/*.js",
       "./constants": "./dist/constants/index.js",
       "./constants/*": "./dist/constants/*.js"
     }
   }
   ```

2. **Update Vercel configuration:**

   - Ensure includeFiles pattern in vercel.json matches new structure

3. **Update Jest configuration:**
   - Update moduleNameMapper to handle new import paths

### 5. Create Import Validation Tool

Enhance the existing import validation tool to:

1. Enforce the use of `import type` for type-only imports
2. Validate path alias usage across all packages
3. Check that the correct submodules are being imported

### 6. Documentation

1. **Create interface contracts documentation:**

   - Document each shared module's purpose
   - Specify which packages should use which modules
   - Document versioning and change management approach

2. **Add examples of correct import usage:**
   - Show examples for different scenarios (types, constants, etc.)
   - Document any platform-specific considerations

## Implementation Sequence

1. Restructure shared package
2. Update shared package.json exports
3. Update backend package tsconfig and imports
4. Update extension package imports
5. Update build configurations
6. Enhance validation tools
7. Create documentation
8. Test in all environments

## Verification and Testing

1. Run the validation tool to verify imports
2. Ensure build process works for all packages
3. Verify tests pass in all packages
4. Test extension in browser environment
5. Test backend functions in Vercel environment
