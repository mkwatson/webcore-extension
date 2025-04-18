# 🚀 WebCore - AI for the Web

> Bringing AI assistance directly into the browser, where users already spend their time.

This project aims to be for Chrome what Cursor is for VS Code - integrating AI assistance directly into the browsing environment rather than requiring users to switch to separate chat interfaces.

## Current Status

- **Project Infrastructure:** The monorepo structure (PNPM Workspaces), core tooling (TypeScript, ESLint, Prettier, Jest, Husky), basic CI (GitHub Actions), and package scaffolding (`extension`, `backend`, `shared`) are complete and fully operational.
- **Firebase Authentication:** Successfully implemented and verified Google Sign-In using the `chrome.identity` API within the Plasmo extension framework. Users can sign in via the sidepanel.
- **Content Extraction:** Implemented content extraction using Readability and Turndown to convert page content to markdown format for processing by AI models.
- **Serverless Functions:** Backend API functions are properly bundled using esbuild for deployment to Vercel, with appropriate error handling and testing.
- **Cross-Package Imports:** All packages properly import from each other with a standardized approach, ensuring both build-time and runtime compatibility.
- **Testing:** Comprehensive test suite for all packages, with proper mocking of Chrome API and Firebase services.

## MVP Features

The current Minimum Viable Product (MVP) delivers:

- A Chrome extension with a sidebar UI (sidepanel).
- Google OAuth authentication via Firebase Auth.
- A single-session chat interface within the sidebar.
- A "Summarize" button to generate an LLM summary of the current page content.
- Clear display of the summary prompt used.
- Loading and error indicators.
- Robust content extraction from any webpage.

## Tech Stack

- **Monorepo:** PNPM Workspaces with TurboRepo
- **Frontend:** Plasmo Chrome Extension Framework + React + TypeScript
- **Backend:** Vercel Serverless Functions + TypeScript
- **Auth:** Firebase Auth (Google OAuth via `chrome.identity`)
- **AI:** AWS Bedrock for AI models
- **Tooling:** ESLint, Prettier, Jest, Vitest, Husky, GitHub Actions

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
    - Create a `.env` file inside the `packages/extension/` directory (`packages/extension/.env`).
    - Populate it with your Firebase project configuration, prefixing each key with `PLASMO_PUBLIC_` (like `PLASMO_PUBLIC_FIREBASE_API_KEY`, `PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.).
    - Ensure you have created an **OAuth 2.0 Client ID** of type **Chrome App** in your Google Cloud Console credentials and added it to `packages/extension/package.json` under the `manifest.oauth2.client_id` key.
4.  **Set up AWS Credentials for Backend:**
    - Create a `.env` file inside the `packages/backend/` directory.
    - Add your AWS credentials for the Bedrock service.
5.  **Run the development server:**
    ```bash
    # This command starts the Plasmo dev server for the extension
    pnpm --filter extension dev
    ```
6.  **Load the extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode" (toggle in the top right).
    - Click "Load unpacked".
    - Select the `packages/extension/build/chrome-mv3-dev` directory from this project.
    - The extension ("DEV | Extension") should load. You can pin it for easy access.

## Development Workflow

### Building and Testing

```bash
# Run all linting checks
pnpm lint

# Run TypeScript type checking
pnpm tsc --noEmit

# Run all tests
pnpm test

# Build all packages
pnpm build

# Check cross-package imports
pnpm find:imports

# Run backend functions locally
cd packages/backend && pnpm exec vercel dev
```

### Package Scripts

- **Root:** `lint`, `test`, `build`, `find:imports`, `predeploy`
- **Backend:** `build`, `lint`, `test`, `bundle`, `dev`, `deploy`
- **Extension:** `build`, `dev`, `lint`, `test`
- **Shared:** `build`, `lint`

## Cross-Package Imports

For proper cross-package imports that work both at build time and runtime:

- **Frontend (Extension):** Use package name imports

  ```typescript
  import { ChatMessage } from '@webcore/shared/types/messaging'
  ```

- **Backend:** Use relative imports for runtime compatibility
  ```typescript
  import { ChatMessage } from '../../shared/src/types/messaging'
  ```

## Important Architecture Notes

### TypeScript Monorepo Setup

This project uses PNPM workspaces with a standardized pattern for sharing code between packages.

The main shared types are in the `@webcore/shared` package, organized by functionality:

- `/types` - Common TypeScript interfaces and types
- `/constants` - Shared constants and configuration

### Serverless Function Architecture

The backend follows serverless best practices:

- All functions are bundled with esbuild before deployment
- Runtime tests verify that bundled functions work correctly
- Proper relative imports ensure runtime compatibility
- Vercel configuration is optimized for bundled functions

### Unit Testing

- Every package has full unit test coverage
- Jest is used for frontend tests with Chrome API mocking
- Vitest is used for backend tests
- Tests verify both type correctness and runtime behavior

## Future Optimizations & Architectural Notes

- **Current Approach:**
  The extension always sends the current page contents and full chat history with every user message. This is stateless, robust, and ideal for serverless/Edge environments, but can lead to larger payloads as conversations grow.

- **Potential Future Optimizations:**
  - Only send page contents once per session, or when the page changes.
  - Move to a stateful backend to manage chat history and context, reducing payload size.
  - Implement smarter truncation or summarization of chat history to stay within model context limits.
  - Explore caching, compression, or deduplication of repeated context.
