#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  // Read package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error(`package.json not found at ${packagePath}`);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Validate version format (semver)
  const version = packageJson.version;
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid version format in package.json: ${version}`);
  }
  
  // Read manifest.json
  const manifestPath = path.join(__dirname, '..', 'src', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found at ${manifestPath}`);
  }
  
  const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Check if version needs updating
  if (manifestJson.version === version) {
    console.log(`ℹ️ manifest.json already at version ${version}, no update needed`);
    process.exit(0);
  }
  
  // Update manifest version
  manifestJson.version = version;
  
  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2));
  
  console.log(`✅ Updated manifest.json from ${manifestJson.version} to version ${version}`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
} 