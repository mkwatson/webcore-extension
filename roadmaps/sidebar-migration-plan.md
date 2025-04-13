# 🚀 WebCore - Sidebar Migration Plan

**Goal:** Replace the current Chrome extension popup UI with a sidebar UI that pushes page content aside, while ensuring existing Firebase Authentication continues to function. Content extraction and complex state management are deferred.

**Current State:**

- Extension UI is primarily implemented in `packages/extension/src/popup.tsx`.
- Firebase Authentication flow (likely using `chrome.identity`) is initiated or managed within the popup's context.
- The extension icon click opens the popup.

**Target State:**

- Extension UI is implemented in `packages/extension/src/sidepanel.tsx`.
- Deleting `packages/extension/src/popup.tsx`.
- The extension icon click opens the sidebar, which pushes page content.
- Firebase Authentication flow works correctly when initiated from the sidebar.
- Basic chat state is managed transiently within the sidebar component (resets on close/navigation).

## Migration Steps

This plan leverages Plasmo's convention-over-configuration approach, inspired by the `with-sidepanel` example.

1.  **✅ [X] Create Sidebar File:**

    - Create a new file: `packages/extension/src/sidepanel.tsx`.

2.  **✅ [X] Adapt UI Components:**

    - Copy the core React component structure, UI elements (buttons, input fields, display areas), and styling imports/logic from `packages/extension/src/popup.tsx` into `packages/extension/src/sidepanel.tsx`.
    - Adjust layout and styling as needed for the sidebar context (potentially more vertical space).

3.  **✅ Migrate Authentication Logic:**

    - Identify the Firebase authentication logic (e.g., sign-in button handler, `useEffect` hooks checking auth state, calls to `chrome.identity.getAuthToken`) within `popup.tsx`.
    - Move this logic into the appropriate places within the `sidepanel.tsx` component. The core `chrome.identity` API calls should function similarly in the side panel's context.

4.  **✅ Implement Simplest Chat State:**

    - Use standard React state (`useState`, `useReducer`) within the main `sidepanel.tsx` component to manage the chat messages (user input, assistant responses).
    - This state will be inherently transient and reset when the sidebar is closed or the user navigates, satisfying the "easiest" requirement for the MVP.

5.  **✅ Remove Popup File:**

    - Delete the `packages/extension/src/popup.tsx` file. This signals to Plasmo to remove the `action.default_popup` configuration from the generated manifest.

6.  **✅ Run Development Build:**

    - Execute `pnpm --filter extension dev` in your terminal.
    - Plasmo should detect the new `sidepanel.tsx` and the deleted `popup.tsx`, automatically generating the necessary `side_panel` configuration in the manifest.

7.  **✅ Verify Sidebar Activation:**

    - Load/reload the unpacked extension in Chrome (`chrome://extensions`).
    - Click the extension's toolbar icon.
    - **Expected:** The sidebar should open on the right side of the page, pushing the main page content to the left.

8.  **✅ Verify Authentication Flow:**

    - Test the sign-in process initiated from the sidebar.
    - Test any logic that depends on the user's authenticated state (e.g., showing user info, enabling features).
    - **Expected:** Authentication should complete successfully, and the user state should be reflected correctly in the sidebar UI.

9.  **✅ Verify Basic Chat UI:**

    - Interact with the chat input and any placeholder display logic.
    - Close and reopen the sidebar, or navigate to a new page and open it again.
    - **Expected:** Basic input/display should work. The chat history should reset upon closing/navigation, consistent with the simple state approach.

10. **✅ Inspect Generated Manifest (Optional but Recommended):**
    - Check the generated `packages/extension/build/chrome-mv3-dev/manifest.json`.
    - **Expected:** Ensure there is no `action.default_popup` key. Verify the presence of a `side_panel` key, likely pointing to `sidepanel.html` (Plasmo generates this wrapper).

## Challenges & Considerations

- **Execution Context Differences:** While both popups and side panels can access `chrome.*` APIs, their underlying execution contexts (Popup view vs. Offscreen Document for Side Panel) have subtle lifecycle differences. The primary risk is unexpected behavior with async operations or event listeners if they weren't written defensively.
  - **Mitigation:** The core Firebase/`chrome.identity` flow is standard and generally robust. Thorough testing (Step 8) is key. Debugging the side panel might require inspecting its specific view via `chrome://extensions`.
- **State Persistence:** The chosen "easiest" state management approach means no persistence between sidebar closures or navigations.
  - **Mitigation:** This is acceptable per requirements for the MVP. Document this limitation clearly. Future work will involve leveraging `chrome.storage` or background service workers for persistence if needed.
- **Plasmo Manifest Generation:** Relying on Plasmo's conventions means trusting it correctly updates the manifest.
  - **Mitigation:** Usually reliable, but verification (Step 10) provides certainty. If issues arise, `package.json` manifest overrides can be used, but should be unnecessary.
- **Styling Conflicts:** Sidebar CSS might inadvertently conflict with page CSS, or vice-versa, although the sidebar runs in its own document. More likely is ensuring the sidebar's own styling is self-contained and adapts well to the container.
  - **Mitigation:** Use specific CSS selectors, potentially CSS Modules or styled-components if not already, and test on diverse websites.

## Recommended Approach

Follow the steps outlined above sequentially. This leverages Plasmo's strengths in abstracting manifest configurations and build processes, allowing focus on migrating the React UI and core auth logic. The `with-sidepanel` example serves as a good structural reference for `sidepanel.tsx`.

## Verification Checklist

- [x] `packages/extension/src/sidepanel.tsx` created.
- [x] UI elements from `popup.tsx` are present in `sidepanel.tsx`.
- [x] Auth logic from `popup.tsx` is integrated into `sidepanel.tsx`.
- [x] Basic React state manages chat history within `sidepanel.tsx`.
- [x] `packages/extension/src/popup.tsx` deleted.
- [x] `pnpm --filter extension dev` runs without errors related to popup/sidepanel config.
- [x] Clicking extension icon opens the sidebar.
- [x] Sidebar pushes page content aside.
- [x] Firebase authentication flow completes successfully via sidebar.
- [x] Authenticated user state is reflected in the sidebar.
- [x] Basic chat input and display work within the sidebar.
- [x] Chat history resets when sidebar is closed and reopened.
- [x] (Optional) `manifest.json` contains `side_panel` and no `action.default_popup`.
