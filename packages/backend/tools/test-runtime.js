#!/usr/bin/env node

/**
 * Simple runtime test for the bundled API functions.
 * This script:
 * 1. Bundles the API functions using esbuild
 * 2. Imports the bundled function directly
 * 3. Tests its execution with a mock request
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const API_DIR = path.join(ROOT_DIR, 'api');
const BUNDLED_API_DIR = path.join(DIST_DIR, 'api');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Bundle the API functions
console.log('📦 Bundling API functions...');
try {
  execSync('pnpm bundle', { cwd: ROOT_DIR, stdio: 'inherit' });
  console.log('✅ Bundling successful!');
} catch (error) {
  console.error('❌ Bundling failed:', error.message);
  process.exit(1);
}

// 2. Test the bundled chat function
console.log('\n🧪 Testing bundled chat function...');

// We'll create a simple mock environment for testing
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map();
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
    this.body = options.body;
  }

  async text() {
    return this.body;
  }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || '';
    this.headers = new Map();
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
};

global.Headers = class Headers extends Map {};

// Create mock environment variables for AWS credentials
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'us-west-2';

// Import the bundled function
try {
  const bundledChatPath = path.join(BUNDLED_API_DIR, 'chat.js');
  console.log(`Importing bundled function from: ${bundledChatPath}`);
  
  // Check if the file exists
  if (!fs.existsSync(bundledChatPath)) {
    throw new Error(`Bundled file not found at: ${bundledChatPath}`);
  }

  // Try to require the bundled file
  const chatHandler = require(bundledChatPath).default;
  
  if (typeof chatHandler !== 'function') {
    throw new Error('Imported handler is not a function');
  }

  console.log('✅ Successfully imported bundled function');

  // Create a mock request
  const mockRequest = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Test message' }
      ]
    })
  });

  // Execute the handler with the mock request
  console.log('🚀 Executing handler with mock request...');
  chatHandler(mockRequest)
    .then(response => {
      console.log(`✅ Handler executed! Response status: ${response.status}`);
      console.log('RuntimeTest: SUCCESS');
    })
    .catch(error => {
      console.error('❌ Handler execution failed:', error);
      console.log('RuntimeTest: FAILED');
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 