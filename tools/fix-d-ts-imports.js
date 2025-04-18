#!/usr/bin/env node

/**
 * Fix import patterns in TypeScript declaration files.
 * This script modifies .d.ts files to use the standardized import patterns.
 */

const fs = require('fs');
// const path = require('path'); // Unused
const { execSync } = require('child_process');

// Find all .d.ts files with problematic imports
function findProblematicDtsFiles() {
  try {
    // Find all .d.ts files that contain old messaging-types imports
    console.log('🔍 Finding .d.ts files with deprecated import patterns...');
    
    const cmd = 'find packages -name "*.d.ts" -exec grep -l "messaging-types" {} \\;';
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    
    if (!result) {
      console.log('✅ No problematic declaration files found.');
      return [];
    }
    
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding problematic .d.ts files:', error);
    return [];
  }
}

// Replace old imports with standardized patterns
function fixImportPatterns(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace old messaging-types imports with new pattern
    const oldPattern = /from\s+["']@webcore\/shared\/messaging-types["']/g;
    const newPattern = 'from "@webcore/shared/types/messaging"';
    
    const updatedContent = content.replace(oldPattern, newPattern);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('🔧 Fixing import patterns in TypeScript declaration files...');
  
  const problematicFiles = findProblematicDtsFiles();
  
  if (problematicFiles.length === 0) {
    return;
  }
  
  console.log(`Found ${problematicFiles.length} files to fix:`);
  
  let fixedCount = 0;
  problematicFiles.forEach(filePath => {
    const wasFixed = fixImportPatterns(filePath);
    if (wasFixed) {
      console.log(`  ✅ Fixed: ${filePath}`);
      fixedCount++;
    } else {
      console.log(`  ⚠️ No changes needed: ${filePath}`);
    }
  });
  
  console.log(`\n🎉 Fixed imports in ${fixedCount} declaration files.`);
}

// Run the script
main(); 