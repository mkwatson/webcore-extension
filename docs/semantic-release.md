# Semantic Release Configuration

This document explains how semantic-release is configured in this project and how it interacts with our Git hooks.

## Overview

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automate the versioning and release process. This tool analyzes commit messages to determine the next version number, generates a changelog, and creates GitHub releases.

## Git Hooks Bypass

Our project uses Husky to enforce the use of our custom commit script (`npm run c`) for all commits. This ensures consistent commit message formatting.

However, semantic-release needs to create its own commits during the release process to update version numbers and changelogs. To allow this to work smoothly, we have implemented two complementary approaches:

### 1. Local Development: Pattern-based Hook Bypass

In `.husky/pre-commit`, we:

1. Check if there is a commit message file
2. Look for the pattern `chore(release):` at the beginning of the message
3. If found, we allow the commit to proceed without enforcing our commit script
4. For all other commits, we continue to enforce using our commit script

This approach is reliable for local development as it works regardless of how semantic-release constructs its Git commands.

### 2. CI Environment: Disabling Husky

In our GitHub Actions workflow, we set the `HUSKY=0` environment variable when running semantic-release:

```yaml
- name: Semantic Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NODE_ENV: production
    HUSKY: 0
  run: npx semantic-release
```

This completely disables Husky hooks during the semantic-release process in CI, ensuring that it can create commits without being blocked.

### Why This Dual Approach?

1. **Belt and suspenders**: We have a reliable solution for both local development and CI environments
2. **Precise control**: In development, we specifically allow only semantic-release commits to bypass checks
3. **Simplicity in CI**: In CI, we disable hooks completely to avoid potential path resolution issues
4. **Version sync**: We still synchronize the manifest.json version for all commits

### Testing

You can test if the local configuration works by running:

```bash
echo "chore(release): 1.0.0" > $(git rev-parse --git-dir)/COMMIT_EDITMSG && .husky/pre-commit
```

This simulates a semantic-release commit and should show the hook allowing it through.

To test disabling Husky entirely (like in CI):

```bash
HUSKY=0 git commit -m "test commit"
```

## Related Files

- `.husky/pre-commit` - Contains our pre-commit hook that allows semantic-release commits
- `scripts/commit.js` - Our custom commit script for human developers
- `.releaserc.json` - Contains the semantic-release configuration
- `.github/workflows/ci-cd.yml` - Contains the CI configuration with Husky disabled for semantic-release 