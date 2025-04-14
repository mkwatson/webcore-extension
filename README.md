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
