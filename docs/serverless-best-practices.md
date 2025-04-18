# Serverless Function Best Practices

This document outlines the best practices for developing and deploying serverless functions in our monorepo structure.

## Key Practices

### 1. Always Use Explicit Relative Imports

When importing from other packages in the monorepo, always use explicit relative paths rather than path aliases:

```typescript
// ❌ AVOID this (works at build time but may fail at runtime):
import { SharedType } from '@webcore/shared/messaging-types'

// ✅ USE this instead (works consistently):
import { SharedType } from '../../shared/src/messaging-types'
```

TypeScript path aliases work during compilation but may not translate correctly to Node.js module resolution at runtime in serverless environments.

### 2. Bundle Functions with All Dependencies

All serverless functions should be bundled into single files with all their dependencies:

```bash
# Bundle API functions
pnpm --filter @webcore/backend bundle
```

This ensures:

- All dependencies are included
- Path resolution issues are eliminated
- Smaller, faster deployments
- Consistent behavior across environments

### 3. Test Runtime Behavior Before Deployment

Always test the actual bundled functions with runtime checks:

```bash
# Run runtime tests
pnpm --filter @webcore/backend test:runtime
```

This catches issues that static analysis and build-time checks miss.

### 4. Use Automated Pre-deploy Checks

We've added a `predeploy` script to automatically run bundling and runtime tests:

```bash
# Before deploying
pnpm predeploy
```

This prevents deploying functions with runtime resolution issues.

## Implementation Details

### Bundling Implementation

We use esbuild to bundle all API functions:

```javascript
// packages/backend/package.json
{
  "scripts": {
    "bundle": "esbuild api/*.ts --bundle --platform=node --target=node16 --outdir=dist/api --external:@vercel/node"
  }
}
```

### Runtime Testing

Our runtime test script:

1. Bundles the API functions
2. Imports the bundled function directly
3. Tests actual execution with mock requests

This catches module resolution issues that occur at runtime but not build time.

### Vercel Configuration

We use a custom `vercel.json` configuration to tell Vercel to use our bundled functions:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["../shared/src/**/*.ts"],
        "maxDuration": 10
      }
    }
  ],
  "routes": [
    {
      "src": "/api/chat",
      "dest": "/api/chat.ts"
    },
    {
      "src": "/api/hello",
      "dest": "/api/hello.ts"
    }
  ]
}
```

This configuration:

1. Tells Vercel to include the shared package's source files
2. Sets appropriate execution time for the functions
3. Routes API requests to the correct TypeScript files

## Troubleshooting

If you encounter errors in serverless functions:

1. Check for path alias imports and replace with relative paths
2. Verify that the Vercel configuration is correct
3. Run the runtime tests locally before deploying
4. Look for any errors in the Vercel deployment logs

## Adding New Serverless Functions

When adding new API functions:

1. Place them in the `packages/backend/api` directory
2. Use relative imports for all cross-package dependencies
3. Run bundle and runtime tests before deployment
4. Add a specific route for your function in `vercel.json`
5. Add appropriate tests for your function behavior

## Managing AWS Credentials

For functions that use AWS services like Bedrock:

1. Set up environment variables in the Vercel project settings
2. For local development, use a `.env` file in `packages/backend`
3. Never commit AWS credentials to the repository

Following these practices will ensure reliable, consistent behavior across all environments.
