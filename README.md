# WebCore Extension

A Chrome extension for WebCore.

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the unpacked extension from the `dist` folder in Chrome

## Development

- `npm run build` - Build the extension
- `npm run watch` - Watch for file changes and rebuild automatically
- `npm run clean` - Clean the build directory
- `npm run commit` - Use the interactive commit tool to format commit messages

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer) conventions:

- **Major version (x.0.0)**: Incompatible API changes
- **Minor version (0.x.0)**: New functionality in a backward compatible manner
- **Patch version (0.0.x)**: Backward compatible bug fixes

### Commit Message Format

We use conventional commits to automate versioning. Format your commit messages as:

```
<type>: <description>

[optional body]

[optional footer]
```

Where `<type>` is one of:
- **feat**: A new feature (increments minor version)
- **fix**: A bug fix (increments patch version)
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

Adding `BREAKING CHANGE:` to the footer of a commit will trigger a major version bump.

### Creating Releases

To create a new release:

1. Make sure all changes are committed using the conventional format
2. Run one of the following commands:
   - `npm run release` - Let the system determine the version increment
   - `npm run release:patch` - For a patch release (bug fixes)
   - `npm run release:minor` - For a minor release (new features)
   - `npm run release:major` - For a major release (breaking changes)

## License

ISC License 