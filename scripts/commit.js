#!/usr/bin/env node

/**
 * Simple script to create conventional commits without interactive prompts
 * Usage: node scripts/commit.js <type> <subject> [body...]
 * Example: node scripts/commit.js feat "add new feature" "This implements XYZ" "Another paragraph"
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/commit.js <type> <subject> [body...]');
  process.exit(1);
}

const type = args[0];
const subject = args[1];
const body = args.slice(2);

// Validate type
const validTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
if (!validTypes.includes(type)) {
  console.error(`Error: Type must be one of: ${validTypes.join(', ')}`);
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
  // Run pre-commit hooks if any
  execSync('npm test', { stdio: 'inherit' });
  
  // Execute the git commit command
  execSync(commitCommand, { stdio: 'inherit' });
  
  console.log('Commit created successfully!');
} catch (error) {
  console.error('Failed to create commit:', error.message);
  process.exit(1);
} 