#!/usr/bin/env node

/**
 * Validates imports according to the cross-package dependency resolution plan.
 * This script:
 * 1. Scans backend and extension TypeScript files
 * 2. Checks for problematic import patterns
 * 3. Reports any issues found
 */

const fs = require('fs');
// const path = require('path'); // Unused
const { execSync } = require('child_process');

// Patterns to look for
const INVALID_PATTERNS = [
  {
    pattern: /from ["']\.\.\/\.\.\/shared\//,
    message: 'Uses relative import to shared package. Use "@webcore/shared/..." instead.'
  },
  {
    pattern: /from ["']@webcore\/shared\/messaging-types["']/,
    message: 'Uses deprecated messaging-types import. Use "@webcore/shared/types/messaging" instead.'
  }
];

// Get all TypeScript files in specified packages
function getSourceFiles() {
  try {
    // Use find to get all .ts and .tsx files excluding node_modules and dist
    const cmd = 'find packages/backend packages/extension -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -not -path "*/dist/*"';
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Check a file for problematic imports
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, i) => {
      // Skip non-import lines
      if (!line.includes('import') && !line.includes('from')) {
        return;
      }

      // Check against each invalid pattern
      INVALID_PATTERNS.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          issues.push({
            line: i + 1,
            text: line.trim(),
            message
          });
        }
      });
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Main function
function main() {
  console.log('🔍 Validating imports according to cross-package dependency rules...');
  
  const files = getSourceFiles();
  console.log(`Found ${files.length} TypeScript files to check.`);
  
  let totalIssues = 0;
  const filesWithIssues = [];

  files.forEach(filePath => {
    const issues = checkFile(filePath);
    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({ filePath, issues });
    }
  });

  if (totalIssues > 0) {
    console.error(`❌ Found ${totalIssues} problematic imports in ${filesWithIssues.length} files:`);
    
    filesWithIssues.forEach(({ filePath, issues }) => {
      console.error(`\n${filePath}:`);
      issues.forEach(issue => {
        console.error(`  Line ${issue.line}: ${issue.text}`);
        console.error(`  💡 ${issue.message}`);
      });
    });
    
    process.exit(1);
  } else {
    console.log('✅ All imports are valid!');
  }
}

// Run the script
main(); 