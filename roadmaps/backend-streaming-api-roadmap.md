# Roadmap: WebCore Extension MVP - Refinement & Release

This roadmap outlines the steps to refine the WebCore Extension MVP after initial backend streaming functionality was established, leading up to a beta release.

**Overall Goal:** Transition from a functional streaming prototype to a stable, user-friendly MVP using Anthropic Claude 3.5 via AWS Bedrock, ready for beta testing.

---

## Phase 1: Initial Streaming API & Integration (Completed)

This phase focused on creating the backend API endpoint using Vercel Serverless Functions and integrating it with the frontend to enable streaming chat responses via the OpenAI Chat Completions API.

- [x] **Backend API Setup (`packages/backend`)**
  - [x] Initialize Backend Package
  - [x] Install Dependencies
  - [x] Configure TS Paths
  - [x] Environment Variable Setup (OpenAI Key)
  - [x] Implement `/api/chat` Edge Function (Initial)
- [x] **OpenAI API Call (Streaming Backend)**
  - [x] Instantiate OpenAI Client
  * [x] Implement Token Counting & Basic Truncation (Initial version, later revised)
  - [x] Call Chat Completions API (Streaming)
  - [x] Stream Response Handling (Backend - Direct Pipe)
- [x] **Frontend Integration (Port-based Streaming)**
  - [x] Refactor Background Handler for Streaming Ports (`callApiStream.ts`)
  - [x] Update Sidepanel for Streaming UI (`handleSendMessage`, `port.onMessage`)
  - [x] Implement Context Handling (System Prompt + Page Content via Port)
  - [x] Fix Content Extraction Trigger (`useEffect` on mount)
- [x] **Initial Debugging & Fixes**
  - [x] Resolved Auth "Bad Client ID" (Extension ID mismatch)
  - [x] Fixed Backend Context Handling (Corrected duplicate context sending)
  * [x] Fixed Backend Truncation Logic (Prioritize system/context messages)

---

## Phase 2: MVP Refinement & AWS Integration (Current Focus)

**Rationale for Order:** Stabilize the current working version, perform the core backend migration (Anthropic via AWS), add tests for stability, improve the user experience, address production readiness concerns, and finally prepare for distribution. Integrating AWS Bedrock _before_ beta is a key user requirement for cost management.

1.  **Stabilize & Clean Current State:**

    - **Goal:** Remove temporary debug code and artifacts for a clean baseline.
    - **Tasks:**
      - [x] Remove detailed `[UI Debug]` console logs from `sidepanel.tsx`.
      - [x] Remove detailed `[Backend Debug]` console logs from `api/chat.ts`. Retain only essential error/info logging.
      - [x] Hide or remove the "Extracted Content (Debug)" section from the `sidepanel.tsx` UI (or make it toggleable).
    - **Rationale:** Necessary cleanup before adding new features or major refactors.

2.  **Switch Backend to Anthropic via AWS Bedrock:**

    - **Goal:** Replace OpenAI with Anthropic Claude 3.5 Sonnet (or chosen model) accessed through AWS Bedrock for cost management via credits.
    - **Tasks:**
      - [ ] **AWS Setup:**
        - Configure AWS credentials securely for the Vercel backend environment (e.g., Vercel integrated AWS secrets or IAM roles if applicable).
        - Ensure necessary IAM permissions for Bedrock (`bedrock:InvokeModelWithResponseStream`).
        - Enable access to the desired Anthropic model (`anthropic.claude-3-5-sonnet-20240620-v1:0`) within the AWS Bedrock console for the relevant region.
      - [ ] **Backend Refactor (`api/chat.ts`):**
        - Install AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`).
        - Replace LLM interaction logic with `BedrockRuntimeClient` and `InvokeModelWithResponseStreamCommand`.
        - Adapt the request payload: Separate the system prompt (instructions + page content) into the top-level `system` parameter (as an array of content blocks). Ensure the `messages` array contains only user/assistant turns.
        - **2.3. Refactor API Call Logic (`api/chat.ts`):** (Done)
          - Instantiate `BedrockRuntimeClient` (using explicit credentials from `process.env`).
          - Define Anthropic Model ID (`anthropic.claude-3-5-sonnet-20240620-v1:0`).
          - Adapt payload format for Anthropic Messages API (handle `system` prompts and `messages` array).
          - ~~Bedrock Prompt Caching~~ **DISABLED:** Attempting to use `cache_control` resulted in severe initial response latency with the Haiku model. Caching logic is currently commented out in `api/chat.ts`. Model switched back to Sonnet v1 GA as caching is inactive.
          - Use `InvokeModelWithResponseStreamCommand`.
          - Implement new stream parsing logic to handle Bedrock's chunk format and reformat to SSE for the frontend.
        - Update environment variables (`.env.example`, Vercel settings) for AWS region, credentials (or role). Remove OpenAI key.
        - Review/Adjust token counting/truncation logic for Claude/Bedrock specifics (prioritizing `system` blocks).
      - **2.4. Context Handling:**
        - **Decision:** To ensure context persistence with the stateless backend, the **frontend (`sidepanel.tsx`) will now send the full page context (system prompt, page content, title, URL) on _every_ request** if `extractedContent` is available. The `isContextSent` logic has been removed from the frontend.
        - **Implication:** This increases payload size per request but simplifies the architecture for now.
        - **Future Optimization:** This approach should be revisited later. If payload size becomes an issue, consider implementing a stateful solution (e.g., using Vercel KV in the backend or state management in the background script) to send the large context only once per session.
      - **2.5. Testing & Debugging:** (In Progress) Thoroughly test locally, debug credential/access/streaming issues.
    - **Rationale:** Directly addresses the user requirement to use AWS credits before beta. Incorporates cost-saving prompt caching. Consolidates the backend change into one step (Anthropic+AWS).

3.  **Code Quality & Maintainability Improvements:**

    - **Goal:** Ensure code passes linting, follows best practices, and is maintainable for future developers.
    - **Tasks:**
      - [x] **Fix ESLint and TypeScript Compatibility Issues:**
        - **Context:** The project uses TypeScript 5.8.3, which is newer than the version officially supported by `@typescript-eslint` v7.x (supports <5.6.0). This version mismatch causes subtle linting issues, particularly with directives like `@ts-expect-error`.
        - **Issue Detail:** The backend test file `packages/backend/api/chat.test.ts` contained `@ts-expect-error` comments to suppress necessary `no-explicit-any` errors when mocking Bedrock's `AsyncIterable<any>` stream type. However, due to the TS/ESLint version mismatch, these directives were sometimes flagged as "unused", causing CI/lint failures.
        - **Solution Applied:** Replaced all `@ts-expect-error` comments with standard ESLint disable comments (`// eslint-disable-next-line @typescript-eslint/no-explicit-any`) for these specific mock type assertions. This approach is more robust against tooling interaction issues, explicitly targets only the necessary lines, and clearly documents the intent.
        - **Additional Fixes:**
          - Removed unused import `ChatMessage` in `background/callApiStream.ts`
          - Removed unused `getPageContextMessage` function in `sidepanel.tsx`
          - Added ESLint disable comment to handle an intentional unused variable in destructuring pattern (`const chatHistory = messages.map(({ id, ...rest }) => rest)`)
      - [x] **Documentation:**
        - Added a new "Linting and TypeScript Tooling Notes" section to the main README.md, documenting:
          - The TypeScript version compatibility issue
          - The symptoms observed with `@ts-expect-error` comments
          - The decision to use standard ESLint disable comments
          - The rationale for this approach
          - Future improvement suggestions
      - [x] **Development Environment Notes:**
        - Created comprehensive documentation in `docs/linting-setup.md` covering:
          - Previous linting challenges and their solutions
          - Package-type-specific ESLint configuration implementation
          - Troubleshooting tips for file editing issues
          - Diagnostic commands for development
          - Future tooling recommendations
      - [x] **ESLint Configuration Improvements:**
        - Implemented package-type-specific ESLint configurations:
          - Created `eslintrc.base.js` with common rules for all packages
          - Created `eslintrc.react.js` for React-specific rules
          - Created `eslintrc.node.js` for Node-specific rules
          - Added package-specific `.eslintrc.js` files for each package
          - Updated root `.eslintrc.json` to use the new structure
        - Fixed React plugin warnings in non-React packages
      - [x] **Husky Pre-commit Hook Update:**
        - Fixed deprecation warnings by updating to the latest syntax
        - Ensured consistent behavior between direct lint commands and pre-commit hooks
    - **Rationale:** This work is essential for:
      - **Developer Experience:** Ensures the codebase passes linting checks, allowing contributors to commit code without bypassing pre-commit hooks
      - **CI/CD Pipeline:** Prevents build failures in CI from linting errors
      - **Knowledge Transfer:** Documents tooling quirks and decisions for future developers
      - **Maintainability:** Uses standard, well-understood ESLint patterns instead of relying on TypeScript-specific directives that behave inconsistently in the current environment
      - **Technical Debt:** Proactively addresses issues that could worsen as TypeScript and ESLint versions continue to evolve

4.  **Implement Basic Testing:**

    - **Goal:** Add foundational tests to catch regressions, especially after the backend LLM change.
    - **Tasks:**
      - [x] **Backend (`packages/backend/api/chat.ts`):**
        - [x] Setup test file (`chat.test.ts`) with mocks (`aws-sdk-client-mock`, `console`).
        - [x] Test input validation (reject missing/malformed messages, non-POST methods, CORS OPTIONS).
        - [x] Test payload formatting for Bedrock (correct `system` blocks with prompt + page context, correct `messages` array, correct `modelId`, other parameters).
        - [x] Test stream parsing and SSE formatting (mock `InvokeModelWithResponseStreamCommand`, simulate `message_start`, `content_block_delta`, `message_stop`, verify SSE chunks `data: {...}\n\n`).
        - [x] Test error handling in API (simulate client `send()` throwing, error events in stream, verify 500 responses and error JSON).
        - [x] Test token truncation logic (messages over limit, prioritize system blocks, drop oldest history correctly). (Moved to `messageUtils.test.ts`)
      - [ ] **Frontend (`packages/extension/src/sidepanel.tsx` & extraction code):**
        - Mock Chrome extension APIs (`chrome.runtime.connect`, port methods, `sendToBackground`).
        - Verify connection port name and `postMessage` payload (includes `messages` and `context`).
        - Test UI state transitions: placeholder addition, `isWaitingForResponse` toggling, input enable/disable.
        - Test stream handling: buffer incomplete SSE events, parse `data: {...}`, call `setMessages`, handle `done` and `error` signals, handle `onDisconnect`.
    - **Rationale:** Ensures core backend streaming and frontend port integration remain stable. Clears path for UI refactor with confidence.

5.  **UI/UX Polish:**

    - **Goal:** Improve the sidepanel's look and feel.
    - **Tasks:**
      - [ ] Clean up console debug logs in frontend.
      - [ ] Refine component structure and styling.
      - [ ] Handle empty states, errors, and loading more elegantly.
      - [ ] Ensure accessibility and responsive layout.
    - **Rationale:** Enhances the user experience for beta testers, making the tool more pleasant and professional.

6.  **Production Readiness Tasks:**

    - **Goal:** Address non-functional requirements for a more robust MVP.
    - **Tasks:**
      - [ ] **Error Handling:** Review and enhance error handling on both frontend and backend. Ensure errors are caught gracefully and informative messages are shown/logged.
      - [ ] **Logging:** Finalize production logging strategy. Use structured logging? Integrate a logging service (e.g., Logtail, Axiom via Vercel integration)? Ensure sensitive data is not logged.
      - [ ] **Build Configs:** Review and ensure distinct, optimized configurations for development (`dev`) and production (`build` -> `pnpm build:prod`?).
      - [ ] **Security:** Quick review of dependencies, API key/credential handling, input validation.
      - [ ] **Documentation:** Update `README.md` files in relevant packages with setup, architecture notes, and deployment info.
    - **Rationale:** Hardens the application against common issues found in production/beta environments.

7.  **Beta Distribution Strategy & Execution:**
    - **Goal:** Get the extension into the hands of initial beta testers.
    - **Tasks:**
      - [ ] **Choose Method:** Decide between manual `.zip` or Chrome Web Store (Unlisted).
      - [ ] **Prepare:**
        - If `.zip`: Create a production build (`pnpm build:prod`?) and zip the output directory (`packages/extension/dist` or similar). Write clear installation instructions.
        - If CWS: Register for a developer account, prepare manifest details (icons, description), create store listing (even if unlisted), upload build, submit for review.
      - [ ] **Distribute:** Share the zip/link and instructions with testers. Gather feedback.
    - **Rationale:** The final step to gather real-world usage data and feedback.

---

**Next Immediate Steps:** Focus on Task 1 (Stabilize & Clean) then Task 2 (Switch Backend to Anthropic via AWS Bedrock).
