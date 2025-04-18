# WebCore Extension UI/UX Improvement Roadmap (MVP Focus)

This document outlines the prioritized tasks for improving the UI/UX of the WebCore extension sidepanel, focusing on high-impact changes with reasonable effort for the MVP stage.

**Prioritized Backlog:**

1.  **Signed-Out State Refinement:** `[DONE]`

    - **Goal:** Only display the sign-in option when the user is logged out. Hide the chat interface (message list, input form) and action buttons (Summary).
    - **Implementation:** Use conditional rendering in `sidepanel.tsx` based on the `user` state.

2.  **Summary Button Logic:**

    - **Goal:** Prevent the "Summary" button from being used repeatedly for the same page content.
    - **Implementation:** Introduce new state (`isSummaryGeneratedForCurrentPage: boolean`). Set to `true` when summary is requested. Reset to `false` when `handleGetContent` successfully loads _new_ content. Conditionally render/disable the button based on this state, login status, and content availability.

3.  **Loading Indicator (Chat Response):**

    - **Goal:** Provide visual feedback to the user while waiting for the AI's response after sending a message.
    - **Implementation:** Use the existing `isWaitingForResponse` state in `sidepanel.tsx`. Render a simple indicator (e.g., "Assistant is thinking...", a subtle animation) near the input form or within the message list when this state is true.

4.  **Signed-In User Info (Subtle Relocation):**

    - **Goal:** Make the "Signed in as..." and "Sign Out" button less prominent in the main content area.
    - **Implementation (Initial):** Move the existing user info block and sign-out button to the very top or bottom corner of the sidepanel with minimal styling changes. (Defer popover implementation for later).

5.  **Chat Message Styling (Basic Bubbles):**

    - **Goal:** Improve chat readability by visually distinguishing between user and assistant messages.
    - **Implementation:** Apply basic CSS styles within `MessageList.tsx` or a shared stylesheet (`style.css`) to give messages background colors and potentially different alignments (e.g., user right, assistant left).

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
