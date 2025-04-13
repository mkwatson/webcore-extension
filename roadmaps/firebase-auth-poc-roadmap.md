# Firebase Authentication POC Plan

**Goal:** Implement Google Sign-In using Firebase Authentication within the Plasmo extension, leveraging the Offscreen Document API and Plasmo conventions.

## Phase 1: Firebase Setup & Extension Configuration

- [x] **1. Firebase Console Setup (Manual Task):**

  - **Action:** Ensure you have a Firebase project created.
  - **Action:** Within the project, register a **Web app**.
  - **Action:** In the Authentication section, enable the **Google** Sign-in provider.
  - **Action:** Copy the `firebaseConfig` object (containing `apiKey`, `authDomain`, `projectId`, etc.) provided after registering the web app.
  - **Verification:** You have the `firebaseConfig` values ready.

- [x] **2. Configure Environment Variables:**

  - **Action:** Create a `.env` file in the **root** of the monorepo (alongside the root `package.json`).
  - **Action:** Add your Firebase configuration values to `.env`, prefixing each key with `PLASMO_PUBLIC_`:
    ```dotenv
    PLASMO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    PLASMO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    PLASMO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    PLASMO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    PLASMO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    # PLASMO_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID (Optional)
    ```
  - **Action:** Add `.env` to your root `.gitignore` file.
  - **Verification:** `.env` file exists, contains prefixed keys, and is gitignored.

- [x] **3. Install Firebase SDK:**

  - **Action:** Run `pnpm --filter extension add firebase` from the workspace root.
  - **Verification:** `firebase` is added as a dependency in `packages/extension/package.json` and installed.

- [x] **4. Create Firebase Config File:**
  - **Action:** Create the directory `packages/extension/src/firebase`.
  - **Action:** Create the file `packages/extension/src/firebase/config.ts`.
  - **Action:** Add code to initialize Firebase using environment variables (see previous detailed plan for code).
  - **Verification:** File exists, code uses `process.env.PLASMO_PUBLIC_` variables, initializes and exports the app.

## Phase 2: Offscreen Document Implementation

- [x] **5. Create Offscreen HTML:**

  - **Action:** Create `packages/extension/src/offscreen.html`.
  - **Action:** Add minimal HTML structure with script tag pointing to `offscreen.ts` (see previous detailed plan for code).
  - **Verification:** File exists with the correct script tag.

- [x] **6. Implement Offscreen Script (`offscreen.ts`):**
  - **Action:** Create `packages/extension/src/offscreen.ts`.
  - **Action:** Add code to handle auth request: import Firebase, listen for `chrome.runtime.onMessage`, call `signInWithPopup`, use `sendResponse` (see previous detailed plan for code).
  - **Verification:** File exists, imports Firebase correctly, listens for messages, calls `signInWithPopup`, uses `sendResponse`.

## Phase 3: Background Script Implementation

- [x] **7. Implement Background Script (`background.ts`):**
  - **Action:** Create `packages/extension/src/background.ts`.
  - **Action:** Add code for offscreen document management (`hasOffscreenDocument`, `createOffscreenDocument`, `closeOffscreenDocument`) and message handling (`handleAuthRequest`, listener for `sign-in` message) (see previous detailed plan for code).
  - **Verification:** File exists, includes offscreen management functions, listens for popup messages, sends messages to offscreen, forwards response, closes document.

## Phase 4: Manifest & Popup UI

- [x] **8. Update `package.json` (Extension Manifest Configuration):**

  - **Action:** Open `packages/extension/package.json`.
  - **Action:** Add/modify the top-level `manifest` key to include `"permissions": ["offscreen", "identity"]`.
  - **Verification:** `package.json` includes the `manifest` key with `"offscreen"` and `"identity"` permissions.

- [x] **9. Implement Popup UI (`popup.tsx`):**
  - **Action:** Open `packages/extension/src/popup.tsx`.
  - **Action:** Replace existing content with React component including state, Sign In button, `chrome.runtime.sendMessage` call, and display logic for user/error (see previous detailed plan for code).
  - **Action:** (Optional) Create `packages/extension/src/style.css` for basic styling.
  - **Verification:** Popup component exists, uses state, has Sign In button, calls `chrome.runtime.sendMessage`, displays user/error state.

## Phase 5: Verification

- [x] **10. Run and Test:**
  - **Action:** Ensure any previous `pnpm dev` process is stopped.
  - **Action:** Run `pnpm --filter extension dev` from the workspace root.
  - **Action:** Go to `chrome://extensions`, reload the unpacked extension, check for errors.
  - **Action:** Open the extension popup.
  - **Action:** Click the "Sign In with Google" button.
  - **Verification:** Google OAuth consent screen appears in a new popup.
  - **Action:** Complete the sign-in flow.
  - **Verification:** OAuth popup closes.
  - **Verification:** Extension popup UI updates to show "Signed in as..." or an error message.
  - **Action:** (Optional Debugging) Check background script and offscreen document console outputs.

---
