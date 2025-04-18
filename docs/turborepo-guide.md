# Turborepo Guide for WebCore Extension

This guide explains how to use Turborepo in our monorepo structure to manage builds, tests, and other tasks efficiently.

## Overview

Turborepo is a high-performance build system for JavaScript/TypeScript monorepos. It helps us:

- Run tasks only when necessary
- Cache build outputs for faster builds
- Run tasks in the optimal order based on dependencies
- Handle cross-package dependencies correctly

## Getting Started

### Installation

Turborepo is already installed as a development dependency in the root package.json. To use it, make sure you've run:

```bash
pnpm install
```

### Basic Commands

Use these commands from the root of the repository:

```bash
# Build all packages in the correct order
pnpm build

# Run tests across all packages
pnpm test

# Type check all packages
pnpm typecheck

# Run linting across all packages
pnpm lint

# Start development servers for all packages
pnpm dev
```

### Package-Specific Commands

You can also run commands for specific packages:

```bash
# Build only the backend package
pnpm --filter @webcore/backend build

# Run tests only for the extension package
pnpm --filter extension test
```

## Configuration

### Root Configuration

The root `turbo.json` file defines the pipeline for all tasks in the monorepo:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Key components:

- `dependsOn: ["^build"]` means "build all dependencies first"
- `outputs` defines cacheable outputs of a task
- `cache: false` means a task shouldn't be cached
- `persistent: true` means a task runs continuously (like dev servers)

### Package-Specific Configuration

Each package's `package.json` contains scripts that Turborepo will execute:

```json
{
  "scripts": {
    "build": "tsc -p .",
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Caching

Turborepo automatically caches task outputs based on input files, environment variables, and task dependencies. To leverage this:

1. Ensure outputs are deterministic (same inputs = same outputs)
2. Properly specify `outputs` in `turbo.json` for cacheable artifacts
3. Use `.turbo` directory in `.gitignore` since it contains the cache

To bypass cache:

```bash
pnpm build --force
```

## Troubleshooting

### Build Order Issues

If packages are building in the wrong order, check:

1. Dependencies in package.json files
2. The `dependsOn` configuration in turbo.json

### Cache Not Working

If changes aren't being detected:

1. Try `--force` to bypass cache
2. Ensure all inputs are properly tracked
3. Check for non-deterministic outputs

### Parallel Build Issues

If builds are failing in parallel but work sequentially:

1. Check for race conditions in shared resources
2. Verify dependencies are correctly specified

## Best Practices

1. **Be explicit about dependencies**

   - Both in package.json and in turbo.json

2. **Keep tasks granular**

   - Single-purpose tasks work better with caching

3. **Use consistent npm scripts**

   - Same script names across packages (build, test, etc.)

4. **Document any deviations**
   - If a package has non-standard tasks, document why
