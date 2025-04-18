# Roadmap: Fix Pre-Commit Linting Issues

**Goal:** Resolve the `no-undef` and `no-unused-vars` errors occurring during the `lint-staged` pre-commit hook, ensuring a robust and maintainable linting setup across the monorepo.

**Problem Summary:**

1.  **Root Config Files (`eslintrc.*.js`, etc.):** Linted without a `node: true` environment, causing `no-undef` errors for Node globals (`module`, `require`).
2.  **Tooling Scripts (`tools/*.js`):** Linted with a Node environment but still triggering the _core_ `no-unused-vars` rule (from `eslint:recommended`) for genuinely unused variables.

**Chosen Solution:**

Combine refining ESLint overrides with direct code fixes for the most robust outcome:

1.  **Refine ESLint Overrides (`eslintrc.base.js`):**

    - Add a _new_ override block specifically targeting root-level `.js` config files (`*.js`, `*.config.js`).
    - Set `env: { node: true }` within this new override.
    - Ensure the existing `tools/**/*.js` override correctly disables the _core_ `no-unused-vars` rule (if decided against fixing the code).

2.  **Fix Code in `tools/*.js`:**
    - Identify scripts in `tools/` with `no-unused-vars` errors.
    - Edit these scripts to remove or prefix unused imports/variables (e.g., `_fs`).

**Implementation Steps:**

1.  [x] Create this tracking document (`./roadmaps/fix-precommit-lint-issues.md`).
2.  [ ] Modify `eslintrc.base.js` to add the override for root config files.
3.  [ ] Identify files in `tools/` with unused variable errors (based on previous `lint-staged` output).
    - `tools/find-cross-package-imports.js`
    - `tools/fix-d-ts-imports.js`
    - `tools/validate-imports.js`
    - `tools/verify-build.js`
    - `tools/verify-turborepo.js`
4.  [ ] Read each identified `tools/*.js` file.
5.  [ ] Edit each identified `tools/*.js` file to fix unused variable errors.
6.  [ ] Stage changes (`git add .`).
7.  [ ] Test the fix by running `git commit` (or `npx lint-staged`).
8.  [ ] Commit the final changes.

**Verification:**

- The `lint-staged` pre-commit hook should complete successfully without any ESLint errors.
- Running `pnpm lint` should still pass cleanly.
