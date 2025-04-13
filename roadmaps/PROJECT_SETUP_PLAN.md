# WebCore Project Setup Plan

**Goal:** Establish a fully configured monorepo with PNPM workspaces, TypeScript, linting, formatting, pre-commit hooks, basic testing, and a CI workflow, ready for feature development.

## Phase 1: Monorepo Foundation & Root Tooling

- [x] **1. Initialize Git:**

  - Run `git init` in the project root.
  - _Verify: A `.git` directory is created._

- [x] **2. Initialize PNPM Workspace:**

  - Create `pnpm-workspace.yaml` containing:
    ```yaml
    packages:
      - 'packages/*'
    ```
  - Create a root `package.json`:
    ```json
    {
      "name": "webcore-monorepo",
      "version": "0.0.1",
      "private": true,
      "scripts": {
        "prepare": "husky install"
        // Add root scripts later as needed
      }
    }
    ```
  - Run `pnpm install` (to create `pnpm-lock.yaml`).
  - _Verify: `pnpm-lock.yaml` and root `node_modules` exist._

- [x] **3. Configure Root TypeScript:**

  - Create `tsconfig.base.json` at the root:
    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true,
        "baseUrl": ".",
        "declaration": true,
        "sourceMap": true,
        "composite": true // Important for project references/workspaces
      },
      "exclude": ["node_modules", "**/dist", "**/build", "**/.plasmo"]
    }
    ```
  - _Verify: File exists with specified strict settings._

- [x] **4. Install & Configure Root Linters/Formatters:**

  - Run `pnpm add -D -w typescript eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser`
  - Create `.eslintrc.json` at the root:
    ```json
    {
      "root": true,
      "parser": "@typescript-eslint/parser",
      "plugins": ["@typescript-eslint", "react", "react-hooks"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "prettier" // Must be last
      ],
      "settings": {
        "react": {
          "version": "detect"
        }
      },
      "env": {
        "browser": true,
        "node": true,
        "es2021": true
      },
      "ignorePatterns": ["node_modules", "dist", "build", ".plasmo"]
    }
    ```
  - Create `.prettierrc.json` at the root:
    ```json
    {
      "semi": false,
      "singleQuote": true,
      "trailingComma": "es5"
    }
    ```
  - Create `.prettierignore` (can be initially empty or list `node_modules`, `dist`, `build`, `.plasmo`).
  - _Verify: Config files exist._

- [x] **5. Setup Pre-commit Hooks (Husky & lint-staged):**
  - Run `pnpm add -D -w husky lint-staged`
  - Add `lint-staged` config to root `package.json`:
    ```json
      "lint-staged": {
        "*.{js,jsx,ts,tsx}": "eslint --fix",
        "*.{js,jsx,ts,tsx,json,css,md}": "prettier --write"
      }
    ```
  - Run `pnpm prepare` (or `npx husky install`).
  - Run `npx husky add .husky/pre-commit "pnpm lint-staged"`
  - _Verify: `.husky/pre-commit` exists and is executable. `lint-staged` config present._

## Phase 2: Package Scaffolding & Configuration

- [x] **6. Scaffold `extension` Package (Plasmo):**

  - Run `mkdir packages && cd packages`
  - Run `pnpm create plasmo extension --with-src` (Choose React/TS if prompted).
  - `cd extension`
  - Modify `packages/extension/tsconfig.json` to `extend` the root config and remove duplicate options:
    ```json
    {
      // Keep Plasmo's specific "include"
      "include": ["src", ".plasmo/index.d.ts"],
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        // Keep Plasmo's paths if they exist, or ensure it matches the src layout
        "paths": {
          "~*": ["./src/*"]
        },
        // Ensure composite and declarationDir are set if needed for references
        "composite": true,
        "declarationDir": "dist", // Or similar output dir for declarations
        // Potentially remove options already covered by tsconfig.base.json
        // Example: remove target, module, strict, etc. if they match base
        "jsx": "react-jsx" // Keep Plasmo's JSX setting
      },
      // Add references if planning to reference 'shared' later
      "references": []
    }
    ```
  - Add/verify scripts in `packages/extension/package.json`:
    ```json
    "scripts": {
        "dev": "plasmo dev",
        "build": "plasmo build",
        "lint": "eslint . --ext .ts,.tsx --fix",
        "format": "prettier --write "**/*.{ts,tsx,json,md}"",
        "typecheck": "tsc --noEmit"
     }
    ```
  - _Verify: `packages/extension` exists with Plasmo structure, `src` dir, updated `tsconfig.json`, and scripts._

- [x] **7. Scaffold `backend` Package (Manual):**

  - Run `cd packages && mkdir backend && cd backend`
  - Create `package.json`:
    ```json
    {
      "name": "@webcore/backend",
      "version": "0.0.1",
      "private": true,
      "main": "dist/index.js", // Or adjust based on build output
      "types": "dist/index.d.ts",
      "scripts": {
        "dev": "echo 'Backend dev TBD (e.g., vercel dev)'", // Placeholder
        "build": "tsc -p .",
        "lint": "eslint . --ext .ts --fix",
        "format": "prettier --write "**/*.{ts,json,md}"",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {},
      "devDependencies": {}
    }
    ```
  - Create `tsconfig.json`:
    ```json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./api", // Assuming functions live in api/
        "module": "CommonJS", // Vercel serverless often uses CommonJS
        "composite": true
      },
      "include": ["api/**/*.ts"],
      "exclude": ["node_modules", "dist"],
      "references": [] // Add reference to 'shared' later
    }
    ```
  - Create `api/hello.ts` (Vercel convention):

    ```typescript
    import type { VercelRequest, VercelResponse } from '@vercel/node'

    export default function handler(req: VercelRequest, res: VercelResponse) {
      res.status(200).json({ message: 'Hello from backend!' })
    }
    ```

  - Run `pnpm add -D @vercel/node` (for types).
  - _Verify: `packages/backend` exists with files, correct `tsconfig.json`, placeholder function._

- [x] **8. Scaffold `shared` Package (Manual):**

  - Run `cd packages && mkdir shared && cd shared`
  - Create `package.json`:
    ```json
    {
      "name": "@webcore/shared",
      "version": "0.0.1",
      "private": true,
      "main": "dist/index.js",
      "types": "dist/index.d.ts",
      "scripts": {
        "build": "tsc -p .",
        "lint": "eslint . --ext .ts --fix",
        "format": "prettier --write "**/*.{ts,json,md}"",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {},
      "devDependencies": {}
    }
    ```
  - Create `tsconfig.json`:
    ```json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "composite": true
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules", "dist"]
    }
    ```
  - Create `src/index.ts`:

    ```typescript
    export const SHARED_CONSTANT = 'Hello from shared package!'

    export type SharedType = {
      id: string
      value: number
    }
    ```

  - _Verify: `packages/shared` exists with files and correct `tsconfig.json`._

- [x] **9. Link Packages & Configure References:**
  - Run `cd ../extension && pnpm add @webcore/shared`
  - Run `cd ../backend && pnpm add @webcore/shared`
  - Update `packages/extension/tsconfig.json` references:
    ```json
      "references": [{ "path": "../shared" }]
    ```
  - Update `packages/backend/tsconfig.json` references:
    ```json
      "references": [{ "path": "../shared" }]
    ```
  - _Verify: `package.json` files updated with `workspace:_`dependencies.`tsconfig.json` files updated with references.\*

## Phase 3: Testing Framework

- [x] **10. Install & Configure Jest:**
  - Run `pnpm add -D -w jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom msw`
  - Create `jest.config.js` at the root:
    ```javascript
    /** @type {import('ts-jest').JestConfigWithTsJest} */
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
      moduleNameMapper: {
        // Handle module aliases, especially Plasmo's '~'
        '^~/(.*)$': '<rootDir>/packages/extension/src/$1',
        // Add other aliases if needed
      },
      // Optionally specify projects for monorepo testing
      // projects: ['<rootDir>/packages/*'],
    }
    ```
  - Create `setupTests.ts` at the root:
    ```typescript
    import '@testing-library/jest-dom'
    ```
  - Add root test script to `package.json`: `"test": "jest"`
  - _Verify: Config files exist, script added._

## Phase 4: CI Workflow (GitHub Actions)

- [x] **11. Create Basic CI Workflow:**

  - Create `.github/workflows/ci.yml`:

    ```yaml
    name: CI

    on:
      push:
        branches: [main]
      pull_request:
        branches: [main]

    jobs:
      build_and_test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: pnpm/action-setup@v2
            with:
              version: latest # Or pin a specific version
          - name: Use Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18' # Or your preferred LTS
              cache: 'pnpm'

          - name: Install dependencies
            run: pnpm install

          - name: Lint
            run: pnpm -r lint # Assumes lint script in each package

          - name: Type Check
            run: pnpm typecheck # Assumes root typecheck script

          - name: Test
            run: pnpm test --ci --coverage # Assumes root test script

          - name: Build Shared & Extension
            run: pnpm --filter=@webcore/shared --filter=@webcore/extension build

          # Backend build often handled by Vercel, skip here unless needed
          # - name: Build Backend
          #   run: pnpm --filter=@webcore/backend build
    ```

  - Add root scripts to `package.json`:
    ```json
      "scripts": {
        "prepare": "husky install",
        "lint": "pnpm -r lint",
        "typecheck": "tsc --build --force", // Using tsc --build for project refs
        "test": "jest",
        "build": "pnpm -r build"
        // Add other root scripts as needed
      }
    ```
  - _Verify: Workflow file exists with specified steps. Root scripts added._

## Phase 5: Final Verification

- [x] **12. Run All Checks Locally:**
  - Run `git add .`
  - Run `git commit -m "feat: Initial project setup with tooling"`
  - _Verify: Pre-commit hook runs lint-staged. Commit succeeds._
  - Run `pnpm lint` (from root)
  - _Verify: No lint errors._
  - Run `pnpm typecheck` (from root)
  - _Verify: No type errors._
  - Run `pnpm test` (from root)
  - _Verify: Jest runs successfully (0 tests)._
  - Run `pnpm build` (from root)
  - _Verify: All packages build successfully._
  - Run `pnpm --filter @webcore/extension dev`
  - _Verify: Plasmo dev server starts. Load unpacked extension in Chrome._

---
