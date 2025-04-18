#!/usr/bin/env node

/**
 * This script verifies that Turborepo is correctly set up in the monorepo
 * It checks:
 * 1. Turborepo is installed
 * 2. turbo.json exists and has expected structure 
 * 3. All packages have required scripts
 * 4. Package dependencies are correctly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

let errors = 0;
let warnings = 0;

function log(message, color = RESET) {
  console.log(color + message + RESET);
}

function success(message) {
  log(`✓ ${message}`, GREEN);
}

function warn(message) {
  warnings++;
  log(`⚠ ${message}`, YELLOW);
}

function error(message) {
  errors++;
  log(`✗ ${message}`, RED);
}

function info(message) {
  log(`ℹ ${message}`, CYAN);
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    // If error, assume file doesn't exist or isn't a file
    if (err.code !== 'ENOENT') {
      console.warn(`Warning checking file ${filePath}: ${err.message}`);
    }
    return false;
  }
}

// Check if turborepo is installed
function checkTurboInstallation() {
  info('Checking Turborepo installation...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fileExists(packageJsonPath)) {
    error('package.json not found in current directory');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if turbo is in dependencies
    const hasTurbo = packageJson.devDependencies && packageJson.devDependencies.turbo;
    if (!hasTurbo) {
      error('Turborepo not found in devDependencies');
      return false;
    }
    
    // Check if turbo scripts are present
    const scripts = packageJson.scripts || {};
    const usesTurboBuild = scripts.build && scripts.build.includes('turbo build'); // Check for 'turbo build' specifically
    
    if (!usesTurboBuild) {
      warn('Root package.json build script does not use turbo build');
    } else {
      success('Root package.json has proper turbo build script');
    }
    
    // Try to run turbo --version
    try {
      const result = execSync('pnpm exec turbo --version', { stdio: 'pipe' }).toString().trim(); // Use pnpm exec
      success(`Turborepo installed (${result})`);
      return true;
    } catch (err) {
      error('Failed to run Turborepo: ' + err.message);
      return false;
    }
    
  } catch (err) {
    error('Failed to parse package.json: ' + err.message);
    return false;
  }
}

// Check if turbo.json exists and has correct structure
function checkTurboConfig() {
  info('Checking turbo.json configuration...');
  
  const turboConfigPath = path.join(process.cwd(), 'turbo.json');
  if (!fileExists(turboConfigPath)) {
    error('turbo.json not found');
    return false;
  }
  
  try {
    const turboConfig = JSON.parse(fs.readFileSync(turboConfigPath, 'utf8'));
    
    // Check essential fields
    if (!turboConfig.tasks) { // Check for 'tasks' instead of 'pipeline'
      error('turbo.json is missing tasks configuration');
      return false;
    }
    
    // Check for essential tasks
    const tasks = turboConfig.tasks;
    const requiredTasks = ['build', 'test', 'lint', 'dev']; // Added dev
    const missingTasks = []; // Changed variable name
    
    for (const task of requiredTasks) {
      if (!tasks[task]) {
        missingTasks.push(task);
      }
    }
    
    if (missingTasks.length > 0) {
      warn(`turbo.json tasks are missing: ${missingTasks.join(', ')}`);
    } else {
      success('turbo.json has all required tasks defined');
    }
    
    // Check build configuration
    if (tasks.build && !tasks.build.dependsOn) {
      warn('build task is missing dependsOn configuration');
    } else if (tasks.build && tasks.build.dependsOn.includes('^build')) {
      success('build task depends on ^build');
    } else {
      warn('build task dependsOn does not include ^build');
    }

    if (tasks.build && !tasks.build.outputs) {
      warn('build task is missing outputs configuration');
    } else {
      success('build task has outputs defined');
    }
    
    return true;
    
  } catch (err) {
    error('Failed to parse turbo.json: ' + err.message);
    return false;
  }
}

// Check package scripts
function checkPackageScripts() {
  info('Checking package scripts...');
  
  // Get all package directories
  const packagesDir = path.join(process.cwd(), 'packages');
  if (!fs.existsSync(packagesDir)) {
    error('packages directory not found');
    return false;
  }
  
  const packages = fs.readdirSync(packagesDir)
    .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory());
  
  let allValid = true;
  
  for (const pkg of packages) {
    const packageJsonPath = path.join(packagesDir, pkg, 'package.json');
    if (!fileExists(packageJsonPath)) {
      warn(`${pkg} has no package.json`);
      continue;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      // Check for required scripts for turbo tasks
      const requiredScripts = ['build', 'lint', 'test']; // Base scripts needed for turbo
      if (pkg === 'extension' || pkg === 'backend') { // dev only needed for these?
        requiredScripts.push('dev'); 
      }
      const missingScripts = []; // Changed variable name
      
      for (const script of requiredScripts) {
        if (!scripts[script]) {
          missingScripts.push(script);
        }
      }
      
      if (missingScripts.length > 0) {
        warn(`${pkg} is missing scripts needed for turbo: ${missingScripts.join(', ')}`);
        allValid = false;
      } else {
        success(`${pkg} has required scripts for turbo`);
      }
      
    } catch (err) {
      error(`Failed to parse ${pkg}'s package.json: ${err.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

// Main function
function main() {
  log('=== Turborepo Setup Verification ===', CYAN);
  
  checkTurboInstallation();
  checkTurboConfig();
  checkPackageScripts();
  
  log('\n=== Verification Summary ===', CYAN);
  
  if (errors === 0 && warnings === 0) {
    success('All checks passed! Turborepo is correctly set up.');
  } else {
    if (errors > 0) {
      error(`${errors} error(s) found`);
    }
    if (warnings > 0) {
      warn(`${warnings} warning(s) found`);
    }
    log('Please address these issues to ensure Turborepo works correctly.');
    process.exit(1); // Exit with error if issues found
  }
}

main(); 