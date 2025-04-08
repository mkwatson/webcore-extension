# Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelog generation.

## 📝 How to Create a Commit

Always use our commit script to create properly formatted commits:

```bash
npm run c -- <type> "<subject>" ["<body paragraph 1>" "<body paragraph 2>"]
```

> ❗ Direct `git commit` commands are blocked by our pre-commit hook to ensure consistent commit messages.

## 📋 Commit Types

| Type       | Description                            | Version Impact |
|------------|----------------------------------------|----------------|
| `feat`     | A new feature                          | MINOR          |
| `fix`      | A bug fix                              | PATCH          |
| `docs`     | Documentation changes                  | -              |
| `style`    | Code style/formatting changes          | -              |
| `refactor` | Code changes that neither fix nor add  | -              |
| `perf`     | Performance improvements               | PATCH          |
| `test`     | Adding or updating tests               | -              |
| `build`    | Build system or dependency changes     | -              |
| `ci`       | CI configuration changes               | -              |
| `chore`    | Other changes (no production code)     | -              |
| `revert`   | Revert to a previous commit            | -              |

## 🚨 Breaking Changes

To indicate a breaking change, add `BREAKING CHANGE:` to the commit body:

```bash
npm run c -- feat "completely redesign API" "BREAKING CHANGE: This changes the core API interface"
```

This will trigger a MAJOR version increment.

## 📚 Examples

```bash
# Feature addition
npm run c -- feat "add dark mode" "Implements a new dark mode theme" "Closes #123"

# Bug fix
npm run c -- fix "resolve memory leak in video player"

# Documentation update
npm run c -- docs "update installation instructions"

# Breaking change
npm run c -- refactor "rewrite data processing logic" "BREAKING CHANGE: completely changes the output format"
```

## 🔄 Automatic Versioning

Commits are automatically analyzed to determine version increments:

- `feat:` → Minor version increment (1.0.0 → 1.1.0)
- `fix:`, `perf:` → Patch version increment (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → Major version increment (1.0.0 → 2.0.0)

This automation ensures our versioning accurately reflects the nature of changes. 