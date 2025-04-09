# Debugging Guide

This guide explains how to debug the WebCore Chrome extension effectively using sourcemaps.

## What are Sourcemaps?

Sourcemaps allow you to debug TypeScript code directly in Chrome DevTools even though the browser is running the compiled JavaScript. They map the compiled code back to the original source files, enabling you to:

- Set breakpoints in your TypeScript files
- See accurate line numbers in error stack traces
- Inspect variables with their original TypeScript types

## Development Builds

When developing, always use the development build which includes sourcemaps:

```bash
npm run build:dev
```

For production builds (which exclude sourcemaps):

```bash
npm run build:prod
```

## VS Code Debugging

We've configured VS Code for debugging the extension:

1. Press `F5` or click the "Run and Debug" button in VS Code
2. Select "Debug Chrome Extension" from the dropdown
3. Chrome will launch with the extension loaded
4. You can set breakpoints directly in your TypeScript files in VS Code

## Chrome DevTools Debugging

To debug using Chrome DevTools:

1. Build the extension with sourcemaps: `npm run build:dev`
2. Load the extension from the `dist` folder in Chrome
3. Right-click the extension icon and select "Inspect popup" or navigate to chrome://extensions
4. Open DevTools for the background script by clicking "inspect views: background page"
5. In DevTools, press `Ctrl+P` (or `Cmd+P` on Mac) and type the name of your TypeScript file to open it
6. Set breakpoints in your TypeScript code

### Enabling Sourcemaps in DevTools

If sourcemaps aren't working:

1. Open DevTools
2. Go to Settings (⚙️ icon or `F1`)
3. Under "Sources", ensure "Enable JavaScript source maps" is checked
4. Also check "Enable CSS source maps"
5. Close and reopen DevTools

## Common Debugging Techniques

### Console Logging

Use console methods that pass through ESLint rules:

```typescript
console.warn('Debug info:', someVariable);
console.error('Error condition:', errorDetails);
```

### Debugger Statement

Insert a `debugger;` statement to force a breakpoint:

```typescript
function complexFunction() {
  // Code will pause execution here when DevTools is open
  debugger;
  // more code...
}
```

### Performance Monitoring

For performance issues:

1. Open DevTools
2. Go to the "Performance" tab
3. Click "Record"
4. Perform the slow operation
5. Click "Stop"
6. Analyze the timeline

## Debugging Chrome Extension Contexts

Chrome extensions have different execution contexts:

### Popup Scripts

- Right-click extension icon → "Inspect popup"
- Set breakpoints in DevTools

### Background Scripts

- Go to chrome://extensions
- Find your extension and click "inspect views: background page"
- Set breakpoints in background.ts

### Content Scripts

- Navigate to a page where your content script runs
- Open DevTools for that page
- Find your content script in the Sources panel (usually under "Content scripts")

## Troubleshooting

If you encounter issues with sourcemaps:

1. **Missing sourcemaps**: Ensure you're using `npm run build:dev` not `build:prod`
2. **Can't find TypeScript files**: In DevTools, press `Ctrl+P` and type the `.ts` filename
3. **Wrong line numbers**: Try clearing the browser cache and rebuilding
4. **DevTools not showing sources**: Check that sourcemaps are enabled in DevTools settings 