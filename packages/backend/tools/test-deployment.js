#!/usr/bin/env node

/**
 * Test deployed backend API endpoints.
 * Run after deployment to verify APIs are working correctly.
 */

const https = require('https');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://webcore-extension-backend.vercel.app';
const ENDPOINTS = [
  '/api/hello',
  // Note: chat endpoint requires a POST request with message body
];

// Helper function to make an HTTP request
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main function
async function main() {
  console.log(`🧪 Testing Backend API deployment at: ${API_BASE_URL}`);
  
  let allPassed = true;
  
  for (const endpoint of ENDPOINTS) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const response = await makeRequest(url);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`  ✅ Status: ${response.statusCode}`);
        console.log(`  ✅ Response: ${response.body.substring(0, 100)}${response.body.length > 100 ? '...' : ''}`);
      } else {
        console.error(`  ❌ Failed with status: ${response.statusCode}`);
        console.error(`  ❌ Response: ${response.body}`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`  ❌ Request failed: ${error.message}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('\n🎉 All API endpoints tested successfully!');
    process.exit(0);
  } else {
    console.error('\n❌ Some API endpoint tests failed!');
    process.exit(1);
  }
}

// Run the script
main(); 