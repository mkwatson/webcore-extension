#!/usr/bin/env node

/**
 * This script tests if a Git commit with --no-verify flag bypasses our Husky pre-commit hook.
 * It creates a temporary file, stages it, and attempts to commit with --no-verify.
 * If successful, it will rollback the commit and cleanup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_FILE = 'test-semantic-release.tmp';
const TEST_COMMIT_MSG = 'chore(test): test semantic-release commit with no-verify';

try {
  console.log('🧪 Testing if --no-verify bypasses Husky pre-commit hook...');
  
  // Create a temporary file
  const filePath = path.join(__dirname, '..', TEST_FILE);
  fs.writeFileSync(filePath, `Test file created at ${new Date().toISOString()}`);
  console.log(`✅ Created test file: ${TEST_FILE}`);
  
  // Stage the file
  execSync(`git add ${TEST_FILE}`, { stdio: 'inherit' });
  console.log('✅ Staged test file');
  
  // Attempt to commit with --no-verify
  console.log('🧪 Attempting commit with --no-verify...');
  execSync(`git commit -m "${TEST_COMMIT_MSG}" --no-verify`, { stdio: 'inherit' });
  console.log('✅ Commit succeeded! --no-verify bypasses Husky pre-commit hook');
  
  // Get the commit hash
  const commitHash = execSync('git rev-parse HEAD').toString().trim();
  
  // Reset to the previous commit to undo our test commit
  execSync('git reset --hard HEAD~1', { stdio: 'inherit' });
  console.log(`✅ Reset to before test commit (removed ${commitHash})`);
  
  // Remove the test file if it still exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed test file: ${TEST_FILE}`);
  }
  
  console.log('✅ TEST PASSED: --no-verify flag successfully bypasses Husky pre-commit hook');
  console.log('✅ The solution is valid and should work with semantic-release');
} catch (error) {
  console.error('❌ TEST FAILED:', error.message);
  
  // Clean up in case of failure
  console.log('🧹 Cleaning up...');
  try {
    // Remove the test file if it exists
    const filePath = path.join(__dirname, '..', TEST_FILE);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed test file: ${TEST_FILE}`);
    }
    
    // Unstage any changes
    execSync('git reset', { stdio: 'inherit' });
    console.log('✅ Unstaged any changes');
  } catch (cleanupError) {
    console.error('❌ Cleanup failed:', cleanupError.message);
  }
  
  process.exit(1);
} 