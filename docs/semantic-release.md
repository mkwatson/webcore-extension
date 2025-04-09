# Semantic Release Configuration

This document explains how semantic-release is configured in this project and how it interacts with our Git hooks.

## Overview

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automate the versioning and release process. This tool analyzes commit messages to determine the next version number, generates a changelog, and creates GitHub releases.

## Git Hooks Bypass

Our project uses Husky to enforce the use of our custom commit script (`npm run c`) for all commits. This ensures consistent commit message formatting.

However, semantic-release needs to create its own commits during the release process to update version numbers and changelogs. To allow this to work smoothly, we've configured semantic-release to use the `--no-verify` flag when creating commits.

### Configuration

In `.releaserc.json`, we've added the following to the `@semantic-release/git` plugin configuration:

```json
"commitOptions": ["--no-verify"]
```

This tells semantic-release to skip Git hooks when making commits, allowing it to bypass our pre-commit hook that enforces the use of our commit script.

### Why This Approach?

1. **Clean separation of concerns**: Human developers still use our commit script, while automated tools can bypass it when necessary.
2. **Standard practice**: This is the recommended approach in the semantic-release documentation.
3. **Minimal configuration**: Requires only a small change to our semantic-release config.

### Testing

You can test if this configuration works by running:

```bash
npm run test:semantic-release
```

This script will attempt to make a Git commit with the `--no-verify` flag, which should bypass our Husky pre-commit hook. The test will clean up after itself, so no permanent changes will be made to the repository.

## Related Files

- `.releaserc.json` - Contains the semantic-release configuration
- `.husky/pre-commit` - Contains our pre-commit hook that enforces using our commit script
- `scripts/commit.js` - Our custom commit script
- `scripts/test-semantic-release-commit.js` - Test script for the `--no-verify` bypass 