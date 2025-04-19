# WebCore Extension UI/UX Improvement Roadmap (MVP Focus)

This document outlines the prioritized tasks for improving the UI/UX of the WebCore extension sidepanel, focusing on high-impact changes with reasonable effort for the MVP stage.

**Prioritized Backlog:**

1.  **Signed-Out State Refinement:** `[DONE]`

    - **Goal:** Only display the sign-in option when the user is logged out. Hide the chat interface (message list, input form) and action buttons (Summary).
    - **Implementation:** Use conditional rendering in `sidepanel.tsx` based on the `user` state.

2.  **Summary Button Logic:** `[DONE]`

    - **Goal:** Prevent the "Summary" button from being used repeatedly for the same page content. Remove button after use and highlight the corresponding user message in chat.
    - **Implementation:** Introduce `isSummaryGenerated` state, conditionally render button based on it, add `isActionTriggered` flag to message, add CSS highlight animation.

3.  **Loading Indicator (Chat Response):** `[DONE]`

    - **Goal:** Provide visual feedback to the user while waiting for the AI's response after sending a message.
    - **Implementation:** Initialize assistant placeholder message content with `"..."` and style it distinctively (centered, italic, grey) in `MessageList.tsx` until replaced by streaming content.

4.  **Signed-In User Info (Subtle Relocation):** `[DONE]`

    - **Goal:** Make the "Signed in as..." and "Sign Out" button less prominent. Integrate into a proper header layout.
    - **Implementation:** Implemented as part of the full layout refactor using Chakra UI. Replaced inline info with a minimal header containing a right-aligned Avatar/MenuButton opening a Menu with user info and Sign Out.

5.  **Chat Message Styling (Basic Bubbles):** `[DONE]`

    - **Goal:** Improve chat readability by visually distinguishing between user and assistant messages.
    - **Implementation:** Implemented using Chakra UI Box components with different `bg` props (`blue.100` for user, `gray.100` for assistant) and `alignSelf`.

6.  **Professional Sign-In Button (Simple Style):**

    - **Goal:** Make the "Sign in with Google" button look more standard and trustworthy.
    - **Implementation:** Apply CSS to the existing button in `sidepanel.tsx` to resemble a standard Google sign-in button (e.g., padding, border, maybe an icon if simple).

7.  **Markdown Rendering:**
    - **Goal:** Display AI responses with proper markdown formatting (lists, bold, italics, etc.).
    - **Implementation:** Add `react-markdown` dependency. Update `MessageList.tsx` to use this component for rendering assistant messages.

---

**Lower Priority / Future Considerations:**

- **Lightweight UI Library Integration:** (e.g., Chakra UI, Mantine, Tailwind) - Significant effort, high long-term value.
- **Visual Polish (Manual):** General improvements to spacing, padding, element styling - Effort better spent on UI library?
- **Content Extraction Feedback:** Clearer indication of page analysis state.
- **Code Block Styling/Copy:** Specific enhancements for code in chat.
- **Chat Enhancements:** Copy message button, clear chat history button.
- **Onboarding/Help Text:** Guidance text in empty chat view.
- **Accessibility Improvements:** Deferring for MVP based on user request.
