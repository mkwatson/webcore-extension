# WebCore Extension Project Tasks

## Overview
A Chrome extension that provides an AI-powered chat interface for discussing webpage contents. The extension extracts page content, converts it to markdown, and enables users to have contextual conversations about the page using LLM technology.

## Task Tracking

### 1. UI Components and Layout
- [ ] 1.1. Extension Popup Button/Icon
  - [ ] Design extension icon
  - [ ] Implement popup trigger
  - [ ] Add basic styling

- [ ] 1.2. Sliding Sidebar Panel
  - [ ] Create sidebar container
  - [ ] Implement slide-in/out animation
  - [ ] Handle sidebar positioning
  - [ ] Add resize functionality

- [ ] 1.3. Chat Interface
  - [ ] Design message bubbles
  - [ ] Create input field component
  - [ ] Implement chat container
  - [ ] Add loading states/indicators
  - [ ] Handle scroll behavior
  - [ ] Style chat components

### 2. Page Content Extraction
- [ ] 2.1. Content Scraping
  - [ ] Implement main content detection
  - [ ] Extract page title
  - [ ] Gather metadata (author, date, URL)
  - [ ] Handle different page structures

- [ ] 2.2. Markdown Conversion
  - [ ] Select/implement HTML to Markdown converter
  - [ ] Clean and format content
  - [ ] Handle edge cases (tables, lists, code blocks)
  - [ ] Implement content sanitization

### 3. LLM Integration
- [ ] 3.1. API Layer
  - [ ] Set up OpenAI API client
  - [ ] Implement secure API key management
  - [ ] Add error handling
  - [ ] Create retry mechanism

- [ ] 3.2. Chat Functionality
  - [ ] Implement message handling
  - [ ] Set up context management
  - [ ] Add streaming response support
  - [ ] Handle rate limiting
  - [ ] Implement fallback mechanisms

### 4. State Management and Storage
- [ ] 4.1. Chat History
  - [ ] Design storage schema
  - [ ] Implement persistence logic
  - [ ] Add history retrieval
  - [ ] Handle storage limits

- [ ] 4.2. Extension State
  - [ ] Manage sidebar state
  - [ ] Handle active chat sessions
  - [ ] Implement state persistence

- [ ] 4.3. Configuration
  - [ ] Create settings storage
  - [ ] Implement user preferences
  - [ ] Add configuration UI

### 5. Browser Integration
- [ ] 5.1. Content Scripts
  - [ ] Set up injection logic
  - [ ] Handle script loading
  - [ ] Implement error recovery

- [ ] 5.2. Communication
  - [ ] Set up message passing
  - [ ] Handle cross-origin requests
  - [ ] Implement security measures

- [ ] 5.3. Permissions
  - [ ] Define required permissions
  - [ ] Add permission requests
  - [ ] Handle permission changes

- [x] 5.4. Testing
  - [x] Configure jest-chrome for Manifest V3 APIs
  - [x] Set up mocks for chrome.action and other extension APIs
  - [x] Create helper functions for type-safe testing
  - [x] Implement comprehensive test coverage for background scripts
  - [x] Add tests for content script functionality

- [x] 5.5. Extension Architecture Issues (Fixed)
  - [x] Resolved ES module import/export incompatibility in extension context
  - [x] Fixed service worker global context references (window vs self)
  - [x] Made code context-aware for different extension environments
  - [x] Implemented cross-context communication patterns

### 6. Technical Debt & Production Considerations

- [ ] 6.1. Module Bundling
  - [ ] Evaluate webpack/rollup for proper ES module bundling
  - [ ] Implement proper asset pipeline for production builds
  - [ ] Set up tree-shaking and code splitting

- [ ] 6.2. Architecture Improvements
  - [ ] Replace current global object pattern with proper module system
  - [ ] Implement dependency injection for better testability
  - [ ] Create proper type definitions for Chrome extension APIs
  - [ ] Document service worker limitations and solutions

- [ ] 6.3. Performance Optimization
  - [ ] Analyze and optimize load time for service worker
  - [ ] Minimize content script footprint
  - [ ] Implement lazy loading where appropriate
  - [ ] Add performance monitoring

## Progress Tracking

### Current Status
🟡 Project Setup Complete
🟡 Basic Extension Framework Working
⚪ Feature Development In Progress

### Next Steps
1. Begin with UI components implementation
2. Set up content extraction pipeline
3. Integrate LLM functionality

### Notes
- All tasks should be tested thoroughly before marking as complete
- Security considerations should be reviewed for each component
- Performance impact should be monitored throughout development

## Dependencies
- React
- OpenAI API
- Chrome Extension APIs
- HTML-to-Markdown converter (TBD)

## Debugging Notes

### Extension Loading Issues Resolved

We encountered and resolved two major technical challenges:

1. **ES Module Import/Export Syntax Incompatibility**
   - **Problem**: Service worker registration failed (Status code 3) and content scripts had errors: "Cannot use import statement outside a module"
   - **Solution**: Removed ES module syntax and adopted more traditional export patterns with global objects
   - **Long-term Options**: 
     - Implement proper module bundling with webpack or rollup
     - Use IIFE (Immediately Invoked Function Expressions) for scoping
     - Configure a proper TypeScript compilation pipeline with optimal settings for extensions

2. **Service Worker Context Issues**
   - **Problem**: "Uncaught ReferenceError: window is not defined" in service worker
   - **Solution**: Made code context-aware by detecting the environment (window vs self) and using the appropriate global object
   - **Long-term Options**:
     - Create environment abstractions to handle different contexts
     - Use a specialized framework designed for extensions (e.g., Plasmo)
     - Implement better dependency injection to avoid global object references

The temporary solution uses a simplified architecture that makes objects globally available in both window and service worker contexts, avoiding ES module syntax. This approach enables faster debugging but should be replaced with a more robust architecture for production. 