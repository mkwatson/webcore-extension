# 🚀 WebCore - AI for the Web

> Bringing AI assistance directly into the browser, where users already spend their time.

This project aims to be for Chrome what Cursor is for VS Code - integrating AI assistance directly into the browsing environment rather than requiring users to switch to separate chat interfaces.

## Current Status (As of Auth POC Completion)

- **Project Infrastructure:** The monorepo structure (PNPM Workspaces), core tooling (TypeScript, ESLint, Prettier, Jest, Husky), basic CI (GitHub Actions), and package scaffolding (`extension`, `backend`, `shared`) are complete.
- **Firebase Authentication POC:** Successfully implemented and verified Google Sign-In using the `chrome.identity` API within the Plasmo extension framework. Users can sign in via the popup.

## MVP Goals

The initial Minimum Viable Product (MVP) aims to deliver:

- A Chrome extension with a sidebar UI (pushes page content aside).
- Google OAuth authentication via Firebase Auth.
- A single-session chat interface within the sidebar.
- A "Summarize" button to generate an LLM summary of the current page content.
- Clear display of the summary prompt used.
- Simple loading and error indicators.

## Tech Stack

- **Monorepo:** PNPM Workspaces
- **Frontend:** Plasmo Chrome Extension Framework + React + TypeScript
- **Backend:** Vercel Serverless Functions + TypeScript
- **Auth:** Firebase Auth (Google OAuth via `chrome.identity`)
- **AI:** OpenAI API (planned)
- **Tooling:** ESLint, Prettier, Jest, Husky, GitHub Actions

## Getting Started (Development)

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd webcore-extension
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Set up Firebase Credentials:**
    - Ensure you have completed the Firebase project setup (see `roadmaps/firebase-auth-poc-roadmap.md`, Step 1).
    - Create a `.env` file inside the `packages/extension/` directory (`packages/extension/.env`).
    - Populate it with your Firebase project configuration, prefixing each key with `PLASMO_PUBLIC_` (refer to `packages/extension/.env.example` if created, or the roadmap for required keys like `PLASMO_PUBLIC_FIREBASE_API_KEY`, `PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.).
    - Ensure you have created an **OAuth 2.0 Client ID** of type **Chrome App** in your Google Cloud Console credentials and added it to `packages/extension/package.json` under the `manifest.oauth2.client_id` key.
4.  **Run the development server:**
    ```bash
    # This command starts the Plasmo dev server for the extension
    pnpm --filter extension dev
    ```
5.  **Load the extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode" (usually a toggle in the top right).
    - Click "Load unpacked".
    - Select the `packages/extension/build/chrome-mv3-dev` directory from this project.
    - The extension ("DEV | Extension") should load. You can pin it for easy access.

## Next Steps

Based on the project requirements, the next critical validation step is the **Content Extraction POC**.

## Development Notes

### TypeScript Monorepo Setup (PNPM Workspaces)

This project uses PNPM workspaces and TypeScript project references/paths for code sharing between packages (e.g., `@webcore/extension`, `@webcore/shared`, `@webcore/backend`).

**Important:** During development, we found that standard TypeScript Project References (`references` field in `tsconfig.json`) were **not reliably resolved** by the build/check process within the Plasmo/Parcel environment for the `extension` package.

The **working configuration** uses explicit **Path Aliases** (`paths` field in `packages/extension/tsconfig.json`) to import from other workspace packages like `@webcore/shared`:

```json
// packages/extension/tsconfig.json
{
  // ...
  "compilerOptions": {
    "baseUrl": ".", // Usually inherited from base
    "paths": {
      "~/*": ["./src/*"],
      // This alias maps imports like `@webcore/shared/...`
      // to the correct source directory relative to the root baseUrl.
      "@webcore/shared/*": ["packages/shared/src/*"]
    }
    // ...
  }
  // Note: Project references field was removed as paths are used instead
}
```

**Troubleshooting Tips:**

- Ensure the referenced package (`packages/shared`) is built (`pnpm --filter shared build`) as it generates necessary type definitions.
- Clear the Parcel cache (`rm -rf .parcel-cache`) if you encounter persistent resolution issues after configuration changes.
- Verify the `package.json` (`name`, `types`, `source`, `files` fields) and `src/index.ts` (re-exporting types) in the shared package are correctly configured.

## Monorepo Build & Typecheck

Before running, testing, or deploying any package, always run:

    pnpm typecheck

This ensures all TypeScript project references (like @webcore/shared) are built in the correct order and all shared types are up to date. For a full build of all packages, you can also run:

    pnpm build

This workflow is enforced in CI and is recommended for all contributors. If you build the backend directly, a prebuild script ensures the shared package is built first, but using the root scripts is the most robust and consistent approach.

### Linting and TypeScript Tooling Notes

During development, we encountered linting challenges related to TypeScript version compatibility and mock types:

1. **Problem:** The project uses TypeScript 5.8.3, which is newer than the version officially supported by the installed `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` (v7.x). While updates were applied, a warning persists.

2. **Symptom:** Initially, `@ts-expect-error` comments were used to suppress `no-explicit-any` errors needed for mocking the Bedrock `AsyncIterable` stream type in backend tests (`packages/backend/api/chat.test.ts`). However, the linter (possibly due to the TS version mismatch or a subtle bug) sometimes flagged these valid `@ts-expect-error` directives as "unused", causing lint failures.

3. **Decision:** To ensure reliable linting and maintainability, we switched from `@ts-expect-error` to standard ESLint inline disable comments (`// eslint-disable-next-line @typescript-eslint/no-explicit-any`) for these specific mock type assertions. We also addressed other linting issues by using similar disable comments for intentionally unused variables in destructuring patterns.

4. **Rationale:** This approach is:
   - Robust against tooling interaction issues
   - Explicitly targets only the necessary lines
   - Clearly documents the intent (allowing `any` specifically for complex mock types)
   - Semantically appropriate for the different use cases (type assertions vs. unused variables)

5. **Future Improvement:**
   - Periodically update `@typescript-eslint` packages as they improve compatibility with newer TypeScript releases
   - Consider stricter typing for mocks if feasible in future versions
   - When Jest/testing setups support more precise types for mock streams, consider removing the `any` type assertions
   - Configure ESLint more precisely for test files (potentially with different rules) if test-specific patterns persist

## Future Optimizations & Architectural Notes

- **Current Approach:**
  The extension always sends the current page contents and full chat history with every user message. This is stateless, robust, and ideal for serverless/Edge environments, but can lead to larger payloads as conversations grow.

- **Potential Future Optimizations:**
  - Only send page contents once per session, or when the page changes.
  - Move to a stateful backend to manage chat history and context, reducing payload size.
  - Implement smarter truncation or summarization of chat history to stay within model context limits.
  - Explore caching, compression, or deduplication of repeated context.
  - Revisit third-party streaming helpers/libraries as they mature.
  - Monitor and optimize for performance and cost as usage scales.

- **Rationale:**
  These optimizations can improve performance, reduce costs, and enable richer features, but add complexity and may require backend state or new infrastructure.
