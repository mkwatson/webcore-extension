#!/usr/bin/env node

/**
 * Simple script to create conventional commits without interactive prompts
 * 
 * Usage: 
 *   npm run c -- <type> "<subject>" ["<body paragraph 1>" "<body paragraph 2>" ...]
 * 
 * Examples:
 *   npm run c -- feat "add new button" "This implements a new button component" "Closes #123"
 *   npm run c -- fix "resolve crash on startup" "Fixed initialization sequence"
 *   npm run c -- docs "update README" "Add installation instructions"
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);

// Display help if no arguments provided
if (args.length < 2) {
  console.log('\n🔍 Conventional Commit Helper 🔍\n');
  console.log('Usage: npm run c -- <type> "<subject>" ["<body>"]');
  console.log('\nAvailable types:');
  console.log('  feat     - A new feature (minor version)');
  console.log('  fix      - A bug fix (patch version)');
  console.log('  docs     - Documentation changes');
  console.log('  style    - Code style changes (formatting, etc)');
  console.log('  refactor - Code refactoring');
  console.log('  perf     - Performance improvements');
  console.log('  test     - Adding or updating tests');
  console.log('  build    - Build system changes');
  console.log('  ci       - CI configuration changes');
  console.log('  chore    - Other changes (no production code change)');
  console.log('\nExamples:');
  console.log('  npm run c -- feat "add login page" "Implements user authentication" "Closes #42"');
  console.log('  npm run c -- fix "resolve memory leak"');
  console.log('\nAdd BREAKING CHANGE: in the body to trigger a major version bump.\n');
  process.exit(1);
}

const type = args[0];
const subject = args[1];
const body = args.slice(2);

// Validate type
const validTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
if (!validTypes.includes(type)) {
  console.error(`❌ Error: Type must be one of: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Create commit message
let commitCommand = `git commit -m "${type}: ${subject}"`;

// Add body paragraphs as separate -m flags
if (body.length > 0) {
  body.forEach(paragraph => {
    commitCommand += ` -m "${paragraph}"`;
  });
}

try {
  // Set environment variable to indicate we're using the commit script
  process.env.USING_COMMIT_SCRIPT = 'true';
  
  // Run pre-commit hooks if any
  execSync('npm test', { stdio: 'inherit' });
  
  // Execute the git commit command with the environment variable
  execSync(commitCommand, { 
    stdio: 'inherit',
    env: { ...process.env, USING_COMMIT_SCRIPT: 'true' }
  });
  
  console.log('✅ Commit created successfully!');
} catch (error) {
  console.error('❌ Failed to create commit:', error.message);
  process.exit(1);
} 