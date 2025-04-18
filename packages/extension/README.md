# WebCore Extension

> AI-powered browsing assistant built with [Plasmo](https://docs.plasmo.com/)

## Overview

WebCore is a Chrome extension that brings AI assistance directly into your browser. It provides a convenient sidepanel interface where you can:

- Extract and summarize content from any webpage
- Ask questions about the current page content
- Get AI-powered responses based on the visible content
- Authenticate with your Google account for a personalized experience

## Features

- **Content Extraction**: Automatically extracts the main content from any webpage using Mozilla's Readability.
- **Markdown Conversion**: Converts HTML content to clean markdown for optimal AI processing.
- **Firebase Authentication**: Secure Google authentication using Firebase and Chrome Identity API.
- **Streaming Responses**: Real-time streaming of AI responses for a responsive UX.
- **Simple UI**: Clean, intuitive interface integrated directly into Chrome's sidepanel.

## Development

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   - Create a `.env` file in the root of the extension package
   - Add your Firebase configuration with `PLASMO_PUBLIC_` prefix:
     ```
     PLASMO_PUBLIC_FIREBASE_API_KEY=your_api_key
     PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     PLASMO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     PLASMO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     PLASMO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     PLASMO_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```
   - Configure OAuth client ID in `package.json` under `manifest.oauth2.client_id`

3. Run development server:

   ```bash
   pnpm dev
   ```

4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` directory

### Testing

```bash
# Run extension tests
pnpm test
```

The tests use Jest with mocked Chrome API and Firebase services.

### Building

```bash
# Create production build
pnpm build
```

This creates a production bundle in `build/chrome-mv3-prod/`, ready for distribution.

## Architecture

The extension is built with several key components:

- **Sidepanel UI**: React-based interface for user interaction
- **Background Service Worker**: Handles messaging between UI and content scripts
- **Content Script**: Extracts content from the current webpage
- **Firebase Hook**: Manages authentication state and user sessions
- **Messaging System**: Type-safe communication between extension components

## Related Components

This extension is part of a monorepo with these additional packages:

- **@webcore/shared**: Common types and utilities
- **@webcore/backend**: Serverless API functions for AI processing
