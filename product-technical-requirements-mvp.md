# 🚀 WebCore - AI for the Web

> **Bringing AI assistance directly into the browser, where users already spend their time.**

# Project Planning Document

## 🎯 Product Overview & Goals

**Problem Statement:**  
Web users need seamless AI assistance within their browsing context - for summarizing content, asking questions, and interacting with web pages - without switching to external tools or interfaces.

**Vision:**  
This project is to Chrome what Cursor is to VS Code - bringing AI assistance directly into the browsing environment where users already spend their time, rather than forcing them to use yet another separate chat interface.

**Target Users:**  
Early adopters who regularly consume long-form web content and benefit from quick summaries and follow-up interactions.

**Goals:**  
- Quickly release an MVP to real users (speed over completeness).
- Capture initial feedback and rapidly iterate.
- Validate the core value proposition: in-browser AI assistance.

## 🧠 User Scenarios

These scenarios demonstrate how WebCore transforms the browsing experience:

### Scenario 1: The Academic Researcher
**Sarah** is a graduate student researching neural networks across multiple technical articles. With WebCore:
- She clicks the WebCore icon as each page loads
- With one click, she gets a concise summary highlighting key concepts
- She asks follow-up questions like "Explain backpropagation in simpler terms"
- She continues to the next article without losing context or switching apps
- She saves approximately 40% of her research time and maintains better comprehension

### Scenario 2: The News Consumer
**Marcus** wants to stay informed but struggles with information overload. With WebCore:
- He browses his usual news sites and activates WebCore
- The extension summarizes lengthy articles into key points
- For complex topics, he asks clarifying questions directly in the sidebar
- When articles reference unfamiliar concepts, he asks WebCore for explanations
- He absorbs more information in less time without opening multiple tabs or search engines

### Scenario 3: The Online Shopper
**Priya** is researching a major purchase decision by comparing product reviews. With WebCore:
- She opens multiple reviews of competing products
- WebCore summarizes each review, highlighting pros and cons
- She asks specific questions about features that matter to her
- She makes a more confident purchase decision without manually taking notes
- Her decision-making process is more efficient and thorough

---

## ✅ MVP Feature Scope

### Must-have (initial MVP):
- Chrome extension with a sidebar UI (pushes page content to the side).
- Google OAuth authentication (Firebase Auth).
- Single-session chat UI.
- "Summarize" button generates a summary via LLM.
- Explicitly show (non-editable) summary prompt.
- Simple, clear loading indicator.
- Simple, clear error messaging.

### Future Direction (Post-MVP):
- Additional content types: YouTube videos, PDF documents
- Persistent chat history
- More advanced web page interactions

---

## 🖥️ UI/UX Planning

### Core User Flow:
- Click extension icon → sidebar opens.
- If signed out, user sees "Sign in with Google."
- Once signed in:
  - Sidebar shows greeting: "How can I help you?"
  - User sees a text input box at bottom.
  - User clicks "Summarize":
    - Auto-generated summary request explicitly shown.
    - Clear loading indicator.
    - Summary appears below the request.
  - Users can ask arbitrary follow-up questions.
- Chat history lasts only during the current page session.

### User Experience Philosophy:
- **Ambient Intelligence**: AI lives where users already are, not requiring context-switching
- **Friction Minimization**: One-click access to most useful functions

### Explicit UI Elements:
- Sidebar (pushes page content aside explicitly).
- Google OAuth via Firebase.
- Input text box.
- "Summarize" button.
- Loading spinner.
- Clear error messaging.

### Interaction States:
- **Loading:** Clear spinner.
- **Success:** Response explicitly appears below request.
- **Error:** User-friendly message clearly shown ("Something went wrong, please try again.").

### Visual Guidelines (Minimal):
- Modern, clean, minimal UI.
- Neutral colors, clear text contrast, simple rounded corners.
- Readable sans-serif fonts.

---

## 🛠️ Technical Planning

### Tech Stack:
- **Monorepo:** `pnpm` Workspaces
- **Frontend:** Plasmo Chrome Extension + React + TypeScript
- **Backend:** Vercel Serverless Functions + TypeScript
- **Auth:** Firebase Auth (Google OAuth) with Chrome Identity API
- **AI:** OpenAI API (initial MVP)
- **Linting/Quality Control:** ESLint, Prettier, Strict TypeScript
- **CI/CD:** GitHub Actions for linting, type checks, and deployment

### Content Extraction Strategy:
- Use extension content scripts to access page DOM directly (avoids CORS issues)
- Process content with Readability.js to identify main content
- Convert to clean markdown using Turndown or similar library
- Include metadata (title, URL, date) as structured context
- Simple truncation for content exceeding token limits with user notification

### API Design Rationale:
This API design follows a simplified version of the OpenAI Chat API pattern for several key reasons:
- **Simplicity**: Minimal implementation effort for both frontend and backend
- **Familiarity**: Leverages widely-understood LLM chat patterns
- **Flexibility**: Supports general chat functionality beyond just summarization
- **Statelessness**: Can be implemented without server-side conversation storage for MVP
- **Extensibility**: Can evolve to add model selection, temperature controls, etc.

The primary goal is maximum capability with minimal complexity for rapid MVP development.

### API Contract (OpenAI-Style Pass-Through):
```json
POST /api/chat
Request:
{
  "messages": [
    {"role": "user", "content": "Summarize this page: [content]"},
    // Additional messages in conversation history (for follow-ups)
  ],
  "context": {
    "url": "https://example.com",
    "title": "Optional page title"
  }
}

Response:
{
  "message": {
    "role": "assistant",
    "content": "Generated response text"
  },
  "conversation_id": "conv_123" // Optional, for client reference
}

Response Error (400/500):
{
  "error": "Simple error message"
}
```

### Implementation Notes:
- **API Versioning**: Not needed for MVP (single client/server deployment)
- **Rate Limiting**: Initially rely on OpenAI account spending cap and usage monitoring
- **Token Limits**: Simple truncation from beginning of document for MVP
- **Authentication**: Firebase Auth with Chrome Identity API for secure OAuth flow
- **CORS Handling**: Direct DOM access via extension content scripts

### Error Handling & Edge Cases:
- **Auth Errors:** Redirect clearly back to Firebase OAuth login.
- **API/Network Errors:** Explicit, simple message to retry.
- **Content Too Long:** Notify user when content is truncated.
- **API Limits:** Monitor usage but no hard limits for initial release.

---

## 🛠️ Technical Setup & Infrastructure

### Monorepo Configuration
- PNPM workspaces structure:
  ```
  /packages
    /extension  # Plasmo Chrome extension
    /backend    # Vercel serverless functions
    /shared     # Shared types and utilities
  ```
- Shared dependencies and configurations
- Package-specific build processes

### TypeScript & Type Safety
- Strict TypeScript configuration (`strict: true`)
- Shared type definitions for API contracts
- Chrome extension type definitions
- Base tsconfig extended by each package

### Linting & Code Quality
- ESLint with TypeScript and React plugins
- Prettier for consistent formatting
- Pre-commit hooks using Husky
- GitHub Actions for CI validation

### Testing Strategy
- Jest for unit testing
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking
- Chrome API mocks for extension testing
- Minimal E2E testing with Playwright for critical paths

### Deployment Pipeline
- GitHub Actions workflows:
  - Lint, type-check, and test on every PR
  - Build packages on merge to main
  - Deploy backend to Vercel
  - Package extension for distribution
- Manual Chrome Web Store submission for initial MVP
- Vercel deployment with environment variables

### Development Workflow
- Feature branch workflow
- PR reviews with required checks
- Regular integration testing
- Local development with hot reload

### Early Integration Approach
- **Vertical Slice Testing**: Implement thin slices of full functionality early
- **Environment Parity**: Development environment matches production
- **Continuous Integration**: Frequent integration to catch issues early
- **Risk-First Development**: Address highest-risk integrations first
- **Feature Flags**: Enable/disable features during development
- **Regular End-to-End Testing**: Manual verification of full flow regularly

---

## 📅 Implementation Checklist

This action-oriented checklist replaces traditional milestones with clear, executable tasks and completion criteria.

### 1️⃣ Critical Validations
- [ ] **Authentication Flow POC**
  - ✓ When complete: Firebase OAuth flow works in extension context
  - 🎯 Est. effort: 1-2 days
  - 🚨 Risk level: High

- [ ] **Content Extraction POC**
  - ✓ When complete: Readable content extracted from 80%+ of test sites
  - 🎯 Est. effort: 2-3 days
  - 🚨 Risk level: High

- [ ] **Sidebar UI POC**
  - ✓ When complete: Sidebar shifts page content without breaking layouts
  - 🎯 Est. effort: 1-2 days
  - 🚨 Risk level: Medium

### 2️⃣ Foundation Setup
- [ ] **Monorepo Configuration**
  - ✓ When complete: PNPM workspaces created with shared configurations
  - 🎯 Est. effort: 1 day
  - 🚨 Risk level: Low

- [ ] **CI Pipeline**
  - ✓ When complete: GitHub Actions runs linting and type checks on PRs
  - 🎯 Est. effort: 1 day
  - 🚨 Risk level: Low

- [ ] **Extension Scaffold**
  - ✓ When complete: Basic Plasmo extension loads in Chrome
  - 🎯 Est. effort: 0.5 day
  - 🚨 Risk level: Low

### 3️⃣ Core Functionality
- [ ] **Authentication Implementation**
  - ✓ When complete: Users can sign in/out with Google
  - 🎯 Est. effort: 2-3 days
  - 🚨 Risk level: Medium

- [ ] **Content Extraction Pipeline**
  - ✓ When complete: Extension reliably extracts main content
  - 🎯 Est. effort: 3-4 days
  - 🚨 Risk level: High

- [ ] **Sidebar UI Components**
  - ✓ When complete: Sidebar shows with basic chat interface
  - 🎯 Est. effort: 2-3 days
  - 🚨 Risk level: Medium

- [ ] **API Integration**
  - ✓ When complete: Extension calls backend which calls OpenAI
  - 🎯 Est. effort: 2-3 days
  - 🚨 Risk level: Medium

### 4️⃣ Polish & Launch
- [ ] **Error Handling**
  - ✓ When complete: All error states have user-friendly messages
  - 🎯 Est. effort: 1-2 days
  - 🚨 Risk level: Low

- [ ] **Performance Optimization**
  - ✓ When complete: Content extraction and UI updates feel responsive
  - 🎯 Est. effort: 1-2 days
  - 🚨 Risk level: Medium

- [ ] **Extension Packaging**
  - ✓ When complete: Extension ready for Chrome Web Store submission
  - 🎯 Est. effort: 1 day
  - 🚨 Risk level: Low

- [ ] **Store Submission**
  - ✓ When complete: Extension submitted to Chrome Web Store
  - 🎯 Est. effort: 0.5 day (plus review time)
  - 🚨 Risk level: Medium

### 🚦 Go/No-Go Decision Points
- After Critical Validations: Continue only if all POCs are successful
- After Authentication: Ensure secure token handling before proceeding
- After Content Extraction: Validate extraction quality across test sites
- Before Store Submission: Perform complete end-to-end testing

### 📊 Progress Tracking
- Daily updates on current tasks
- Weekly review of completed items and upcoming work
- Bi-weekly risk reassessment

---

## 🎨 Design & Accessibility

### Accessibility Guidelines (Minimal):
- Clear contrast ratios.
- Basic keyboard navigation.

### Responsive Behavior:
- Consistent sidebar width (recommend ~350px).
- Explicitly pushes page content aside.

### Visual Consistency (Minimal):
- Sans-serif fonts (Inter, Roboto).
- Neutral, minimalist colors.

---

## 📊 Metrics & Success Criteria

Simple metrics to validate the MVP and guide next steps:

### Adoption:
- Total installs.
- Unique active users.

### Engagement:
- Number of chat sessions initiated.
- Number of messages per session.
- Number of summarize actions per user.

### Retention:
- Percentage of users returning within 7 days.
- Percentage of users active weekly after initial install.

### User Feedback:
- Simple in-app "Was this helpful?" feedback
- Qualitative user interviews with early adopters

---

## ⚖️ Legal & Privacy (Minimal):

- Simple Terms of Service:
  - Explicitly states no persistent data retention.
  - Explicit disclaimer: product provided "as-is" without warranty.

- Privacy:
  - No data stored or persisted explicitly in MVP.

---

## 📌 Appendix & Useful Reference Links

- [Plasmo Documentation](https://docs.plasmo.com/)
- [Firebase Auth with Chrome Identity API](https://firebase.google.com/docs/auth/web/google-signin)
- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions/serverless-functions)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Readability.js](https://github.com/mozilla/readability)
- [Turndown (HTML to Markdown)](https://github.com/mixmark-io/turndown)
- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [OpenAI API Usage & Limits](https://platform.openai.com/docs/guides/rate-limits)

---

## 📍 Developer Flexibility vs. Constraints:

| Clearly Defined Constraints                           | Areas of Developer Flexibility (explicitly allowed) |
|-------------------------------------------------------|------------------------------------------------------|
| Sidebar pushes page content (no overlay).             | Exact sidebar dimensions/animation style.            |
| Firebase Auth integration required.                   | Styling of Firebase OAuth button flexible.           |
| Minimal loading/error states shown.                   | Spinner/error styling details.                       |
| Minimal UI components required.                       | Precise spacing, exact colors/shades/fonts.          |
| API endpoints defined.                                | Internal API logic flexible.                         |
| Content extraction approach.                          | Specific libraries and implementation details.       |

---

## ✅ Final Summary & Next Steps:

WebCore brings AI assistance directly into the browser where users already spend their time. The MVP will focus solely on web page text summarization with follow-up questions, delivering immediate value while laying the groundwork for future enhancements.

### Critical Success Factors:
- Swift MVP delivery with core summarization functionality
- Clear user feedback mechanisms
- Technical foundation that enables rapid iteration
- Simple implementation focused on core value

### Immediate Next Actions:
- Finalize the monorepo structure
- Implement Firebase Auth with Chrome Identity API
- Create content extraction pipeline using Readability.js
- Develop simple API endpoint following the defined contract
- Create the sidebar UI with minimal chat capabilities

By starting with a focused MVP and keeping implementation decisions simple, we can quickly validate the core concept and begin the iteration cycle, while keeping the vision of ambient browser intelligence firmly in view.

---

## 🛡️ Risk Assessment & Mitigation Strategy

### Highest Risk Areas

1. **Chrome Extension Integration**
   - Sidebar implementation pushing content aside
   - Content script limitations on certain websites
   - Chrome Web Store review process

2. **Authentication Flow**
   - Firebase Auth + Chrome Identity API integration
   - Token management and security
   - Cross-origin complexities in extension context

3. **Content Extraction Reliability**
   - Diverse website structures and layouts
   - Dynamic content handling
   - Token size limitations

4. **OpenAI API Dependencies**
   - Rate limiting and quota management
   - Response quality consistency
   - Latency unpredictability

5. **User Experience Coherence**
   - Perceived latency during processing
   - Error state handling
   - Context maintenance during navigation

### Mitigation Approach

#### 1. Critical Proof-of-Concepts (Before Full Development)

- **Authentication POC** (Standalone)
  - Minimal extension testing Firebase Auth + Chrome Identity flow
  - Success criteria: Complete sign-in flow with token retrieval
  - Timeframe: 1-2 days maximum

- **Content Extraction POC** (Feature Branch)
  - Test extraction across 10+ diverse website types
  - Success criteria: 80%+ successful extraction rate
  - Timeframe: 2-3 days

- **Sidebar Integration POC** (Standalone)
  - Test page content manipulation approach
  - Success criteria: Works without breaking standard website layouts
  - Timeframe: 1-2 days

#### 2. Resilient Architecture Design

- **Extraction Fallback Cascade:**
  - Primary: Content script direct DOM access
  - Fallback 1: Simplified extraction (main text only)
  - Fallback 2: User-assisted content selection
  
- **Feature Flag System:**
  - Simple boolean toggles in extension storage
  - Control experimental features without redeployment
  - Enable/disable based on stability

#### 3. Progressive User Testing

- **Phase 1: Intensive Dogfooding** (Day 1+)
  - Use partial builds immediately during development
  - Test on personally frequented websites
  - Document issues and unexpected behaviors

- **Phase 2: Limited Alpha** (Basic functionality)
  - 5-10 technical users with diverse browsing habits
  - Specific test scenarios + free exploration
  - Weekly feedback collection

- **Phase 3: Structured Beta** (Core feature completion)
  - 20-30 target users
  - In-extension feedback mechanism
  - Focus on specific use cases

#### 4. Technical Safeguards

- **Structured Logging:**
  - Log all API calls, auth events, and extraction attempts
  - Track success/failure status and key metrics
  - Simple cloud storage for logs (Firebase)

- **Cost Protection:**
  - OpenAI hard spending cap
  - Simple counter for requests per user
  - Basic throttling for unusual usage patterns

#### 5. Scope Management

- **MoSCoW Prioritization:**
  - **Must Have:** Authentication, content extraction, summarization
  - **Should Have:** Error messaging, styling, preferences
  - **Could Have:** Keyboard shortcuts, theme options, settings
  - **Won't Have (MVP):** History, cloud sync, PDF processing

- **Feature Request Parking Lot:**
  - Document ideas for post-MVP consideration
  - Explicit "MVP complete" criteria

### Integration with Development Process

Each phase of development will include:
- Risk reassessment based on POC findings
- Validation of critical functionality before moving forward
- Regular technical review of implementation approaches
- Explicit go/no-go decision points for high-risk features

---

## 🧪 Chrome Extension Risk Validation Plan

The Chrome Extension platform presents several specific technical risks that require validation before full development investment. This section outlines a focused validation approach for the highest-risk areas.

### Critical Risk Areas

1. **Content Script Limitations**
   - Chrome security model may restrict content extraction on certain sites
   - Dynamic content may not be fully accessible
   - Sites with strict CSP may block script execution

2. **Manifest V3 Constraints**
   - Background script limitations affecting state management
   - Permission model changes potentially limiting functionality
   - API compatibility with extension requirements

3. **Sidebar Implementation Challenges**
   - Page content manipulation complexity
   - Layout conflicts with diverse website designs
   - Performance impact on browser experience

4. **Chrome Store Review Process**
   - Approval timeline unpredictability
   - AI-related extension policy compliance
   - Permission justification requirements

### 7-Day Validation Strategy

#### Days 1-2: Content Extraction & Manifest V3 Testing
1. Create a Manifest V3 extension with basic content extraction
   ```javascript
   // Sample content extraction test
   function testExtraction() {
     const basicText = document.body.innerText;
     const readabilityResult = new Readability(document.cloneNode(true)).parse();
     return { 
       basicLength: basicText.length,
       readabilitySuccess: !!readabilityResult,
       readabilityLength: readabilityResult ? readabilityResult.textContent.length : 0
     };
   }
   ```
2. Test across 30 diverse websites in these categories:
   - Banking/Financial (5)
   - SPA/Dynamic content (5)
   - Media-heavy sites (5)
   - Technical documentation (5)
   - E-commerce (5)
   - Web applications (5)
3. Collect quantitative success metrics:
   - Extraction success rate by site category
   - Content quality assessment
   - Execution time and performance impact

#### Days 3-4: Sidebar Implementation Testing
1. Implement two sidebar approaches:
   - Simple CSS content shifting
   ```css
   /* Basic CSS approach */
   body { margin-right: 350px; }
   #webcore-sidebar {
     position: fixed;
     top: 0;
     right: 0;
     width: 350px;
     height: 100vh;
     z-index: 9999;
     box-shadow: -2px 0 5px rgba(0,0,0,0.1);
   }
   ```
   - React-based sidebar component with robustness features
2. Test both implementations across 20 diverse websites
3. Document specific failure patterns and compatibility issues
4. Select approach based on quantitative results

#### Days 5-7: Integration & Submission Preparation
1. Combine successful content extraction and sidebar approaches
2. Add minimal authentication flow with Firebase/Chrome Identity
3. Create proper store listing assets and privacy policy
4. Submit minimal viable version to Chrome Web Store
5. Document submission process and timeline

### Success Criteria

The validation phase will be considered successful when:

1. **Content Extraction**
   - ≥80% successful extraction rate across test sites
   - Clear documentation of site categories where extraction fails
   - Viable fallback strategy identified for problematic sites

2. **Sidebar Implementation**
   - ≥85% of test sites display sidebar correctly
   - No critical layout breaking on major website categories
   - Performance impact within acceptable limits (less than 20% slowdown)

3. **Chrome Store Submission**
   - Initial submission accepted for review
   - Clear timeline expectations established
   - Any policy concerns identified and addressed

### Go/No-Go Decision Criteria

Following the validation phase, development will proceed based on these criteria:

- **Go:** Content extraction success ≥80%, sidebar compatibility ≥85%, no blocking store policy issues
- **Modify Approach:** Success rates 60-80%, with clear patterns of failure that can be addressed
- **No-Go/Pivot:** Success rates <60%, fundamental Chrome API limitations discovered, or insurmountable store policy blockers

---

## 📚 Chrome Extension Research Guide

### Research Objectives
This standalone research assignment aims to gather critical information about Chrome Extension development constraints, particularly focusing on AI-powered extensions that process webpage content. No coding or technical background is required.

### Key Questions to Answer

1. **Chrome Web Store Review Process**
   - What is the current average review time for new Chrome extensions?
   - Are there specific policies affecting AI-powered or content processing extensions?
   - What are common rejection reasons for extensions requesting content access?
   - What distribution alternatives exist if Web Store approval is problematic?

2. **Manifest V3 Limitations**
   - What key limitations do developers report when migrating to Manifest V3?
   - Are there specific workarounds for background processing limitations?
   - How are extensions handling the removal of background pages?
   - What permission model changes affect content-accessing extensions?

3. **Content Extraction Patterns**
   - What approaches do popular content-extraction extensions use?
   - Which extensions successfully process content on complex websites?
   - Are there patterns in how these extensions handle dynamic content?
   - What user permissions or interactions are required for content access?

4. **Sidebar UI Implementation**
   - Which extensions implement a sidebar that shifts page content?
   - How do they handle compatibility with diverse website layouts?
   - What user experience patterns emerge in sidebar-based extensions?
   - Are there performance considerations mentioned by developers?

### Research Methods

1. **Forum & Community Review**
   - Chrome Extension Developer Forum
   - Stack Overflow (tag: google-chrome-extension)
   - Reddit (r/ChromeExtensions)
   - Chrome Web Store Developer documentation

2. **Extension Analysis**
   - Examine 5-10 popular content-processing extensions
   - Review their permissions, descriptions, and user feedback
   - Note any patterns in how they present their functionality
   - Check for alternative distribution methods mentioned

3. **Developer Interviews/Articles**
   - Look for blog posts about Chrome extension development challenges
   - Find interviews with successful extension developers
   - Search for articles about Manifest V3 migration experiences
   - Review any case studies about extension store rejections

### Deliverable Format

Please provide a concise report (2-3 pages) with the following sections:

1. **Chrome Web Store Approval Process**
   - Current timelines and expectations
   - AI-specific policies and considerations
   - Common rejection reasons and workarounds
   - Alternative distribution options

2. **Technical Constraints Summary**
   - Manifest V3 key limitations and workarounds
   - Content access patterns and best practices
   - UI implementation approaches and compatibility
   - Performance considerations

3. **Extension Case Studies**
   - 3-5 brief analyses of relevant extensions
   - Their approaches to content access
   - UI patterns they employ
   - User feedback patterns

4. **Recommendation Summary**
   - Key considerations for our extension development
   - Potential risks and mitigation strategies
   - Timeline expectations for store approval