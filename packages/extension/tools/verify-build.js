#!/usr/bin/env node

/**
 * Verify the extension build is complete and correctly structured.
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
  
  console.log('✅ Build directory exists');
  
  // List all files for debugging
  try {
    const files = fs.readdirSync(BUILD_DIR);
    console.log(`Found ${files.length} files in build directory.`);
    files.forEach(file => console.log(`  - ${file}`));
  } catch (error) {
    console.error('Error reading directory:', error);
    process.exit(1);
  }
  
  // Check manifest exists
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Missing manifest.json');
    process.exit(1);
  }
  console.log('✅ Found manifest.json');
  
  // Parse manifest
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`✅ Manifest version: ${manifest.manifest_version}`);
    console.log(`✅ Extension version: ${manifest.version}`);
  } catch (error) {
    console.error('❌ Error parsing manifest:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Build verification successful!');
}

// Run the script
main();
