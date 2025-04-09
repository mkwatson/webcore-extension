# WebCore Extension

A Chrome extension for WebCore.

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the unpacked extension from the `dist` folder in Chrome

## Development

- `npm run build` - Build the extension
- `npm run build:watch` - Build and watch for changes (with live reload for all file types)
- `npm run watch` - Watch for TypeScript changes only
- `npm run clean` - Clean the build directory
- `npm run c` - Create a conventional commit (recommended)
- `npm run validate` - Run linting, tests, and build
- `npm run package` - Build and package the extension as a ZIP file

## Testing

The project uses Jest for unit testing with TypeScript support:

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode (great for development)
- `npm run test:coverage` - Generate a coverage report

Tests are organized in the `tests` directory mirroring the source code structure:
- `tests/mocks` - Contains Chrome API mocks
- `tests/unit` - Unit tests for utilities and standalone functions
- `tests/background` - Tests for background scripts
- `tests/popup` - Tests for popup functionality

See [TESTING.md](TESTING.md) for detailed testing conventions and examples.

## Contributing

This project uses Conventional Commits for versioning. Please read [COMMIT.md](COMMIT.md) before contributing.

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer) conventions:

- **Current Development Phase (0.x.y)**: The project is in initial development. APIs may change and breaking changes can occur in minor (0.x.0) releases.
- **Future Stable Release (1.0.0)**: Will indicate the first stable, production-ready release with defined public API.
- **Major version (x.0.0)**: Incompatible API changes
- **Minor version (0.x.0)**: New functionality (may include breaking changes before 1.0.0)
- **Patch version (0.0.x)**: Backward compatible bug fixes

The extension's manifest.json version is automatically kept in sync with package.json via our sync-version script, which runs before each commit.

### Creating Releases

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning and releases based on commit messages.

#### Automatic Releases
Merging to the main branch will automatically:
- Determine the next version based on commit types
- Update CHANGELOG.md
- Create a GitHub release with release notes
- Attach the built extension to the release

#### Manual Releases
To manually trigger a release:
1. Go to Actions tab in GitHub
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Optionally select a specific release type (patch/minor/major)
5. Click "Run workflow"

## License

ISC License 