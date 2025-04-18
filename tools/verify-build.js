#!/usr/bin/env node

/**
 * Verify the extension build is complete and correctly structured.
 * This helps ensure the extension will work properly in production.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BUILD_DIR = path.join(__dirname, '..', 'build', 'chrome-mv3-prod');

// Main function
function main() {
  console.log('🧪 Verifying extension build...');
  
  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`❌ Build directory not found at ${BUILD_DIR}. Run 'pnpm build' first.`);
    process.exit(1);
  }
  
  console.log('✅ Build directory exists:', BUILD_DIR);
  
  // Define required files
  const requiredFiles = [
    'manifest.json',
    'sidepanel.html'
  ];
  
  // Check for required files
  const missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    } else {
      console.log(`✅ Found required file: ${file}`);
    }
  }
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing required files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  // Check for required file patterns
  const jsPatterns = [
    /^sidepanel\.[a-z0-9]+\.js$/,
    /^plasmo\.[a-z0-9]+\.js$/
  ];
  
  const files = fs.readdirSync(BUILD_DIR);
  console.log(`Found ${files.length} files in build directory.`);
  files.forEach(file => console.log(`  - ${file}`));

  for (const pattern of jsPatterns) {
    const found = files.some(file => pattern.test(file));
    if (!found) {
      console.error(`❌ Missing required file pattern: ${pattern}`);
      process.exit(1);
    } else {
      console.log(`✅ Found file matching pattern: ${pattern}`);
    }
  }
  
  // Check for background script
  const backgroundPath = path.join(BUILD_DIR, 'static', 'background', 'index.js');
  if (!fs.existsSync(backgroundPath)) {
    console.error('❌ Missing background script at: static/background/index.js');
    process.exit(1);
  } else {
    console.log('✅ Found background script');
  }
  
  // Check manifest.json structure
  try {
    const manifestPath = path.join(BUILD_DIR, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    if (!manifest.manifest_version || !manifest.version) {
      console.error('❌ Manifest file is missing required fields (manifest_version or version).');
      process.exit(1);
    }
    console.log('✅ Found manifest.json');
    console.log('✅ Manifest version:', manifest.manifest_version);
    console.log('✅ Extension version:', manifest.version);
  } catch (error) {
    console.error('❌ Error parsing manifest.json:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Build verification successful!');
}

// Run the script
main(); 