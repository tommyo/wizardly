# Publishing Guide for Wizarding

This guide explains how to publish the Wizarding package to npm.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Ensure you have npm installed (comes with Node.js)
3. **Authentication**: Log in to npm from your terminal

```bash
npm login
```

## Pre-Publication Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm run test:unit`
- [ ] Build succeeds: `npm run build`
- [ ] Version number is updated in `package.json`
- [ ] CHANGELOG is updated (if you maintain one)
- [ ] README is up to date
- [ ] All changes are committed to git

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, minor changes
  ```bash
  npm version patch
  ```

- **Minor** (1.x.0): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

The `npm version` command will:
1. Update the version in `package.json`
2. Create a git commit
3. Create a git tag

## Publishing Steps

### 1. Clean Build

```bash
# Remove old build artifacts
rm -rf dist

# Install dependencies
npm install

# Run tests
npm run test:unit

# Build the package
npm run build
```

### 2. Test the Package Locally (Optional but Recommended)

Before publishing, test the package locally:

```bash
# Create a tarball
npm pack

# This creates a file like wizarding-1.0.0.tgz
# Install it in a test project:
cd /path/to/test-project
npm install /path/to/wizarding/wizarding-1.0.0.tgz
```

### 3. Publish to npm

```bash
# Dry run to see what will be published
npm publish --dry-run

# Publish to npm
npm publish
```

For the first publication, if the package name is available, it will be published as public by default.

### 4. Verify Publication

After publishing:

1. Check your package page: `https://www.npmjs.com/package/wizarding`
2. Try installing it in a test project:
   ```bash
   npm install wizarding
   ```

## Publishing a Beta/Alpha Version

For pre-release versions:

```bash
# Update version to beta
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta
```

Users can install beta versions with:
```bash
npm install wizarding@beta
```

## Updating After Publication

If you need to make changes after publishing:

1. Make your changes
2. Update the version: `npm version patch` (or minor/major)
3. Rebuild: `npm run build`
4. Publish: `npm publish`

## Unpublishing (Use with Caution)

You can unpublish within 72 hours of publication:

```bash
# Unpublish a specific version
npm unpublish wizarding@1.0.0

# Unpublish entire package (use with extreme caution)
npm unpublish wizarding --force
```

**Note**: Unpublishing is discouraged as it can break projects depending on your package. Use deprecation instead:

```bash
npm deprecate wizarding@1.0.0 "This version has a critical bug, please upgrade to 1.0.1"
```

## Automated Publishing with GitHub Actions

The repository includes automated GitHub Actions workflows for CI/CD:

### Setup Required

1. **Create an npm Access Token**:
   - Go to [npmjs.com](https://www.npmjs.com) and log in
   - Navigate to Access Tokens in your account settings
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type (for CI/CD)
   - Copy the generated token

2. **Add Token to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` or `develop` branches:
- Tests on Node.js 20 and 22
- Runs linters (oxlint + eslint)
- Performs type checking
- Runs unit tests
- Runs e2e tests with Playwright
- Builds the package
- Verifies package contents

#### 2. Publish Workflow (`.github/workflows/publish.yml`)

Automatically publishes to npm when you push a version tag:

**How to Publish**:

```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Push the tag to GitHub
git push origin v1.0.1  # replace with your version

# 3. The workflow will automatically:
#    - Run full test suite
#    - Build the package
#    - Publish to npm with provenance
#    - Create a GitHub release
```

**Features**:
- Full test suite before publishing
- npm provenance for supply chain security
- Automatic GitHub release creation
- Package verification before publish

### Manual Publishing (Alternative)

If you prefer manual publishing, follow the steps in the "Publishing Steps" section above.

## Package Scope (Optional)

If you want to publish under a scope (e.g., `@tommyo/wizarding`):

1. Update `package.json`:
   ```json
   {
     "name": "@tommyo/wizarding"
   }
   ```

2. Publish as public scoped package:
   ```bash
   npm publish --access public
   ```

## Best Practices

1. **Always test before publishing**: Run all tests and build locally
2. **Use semantic versioning**: Follow semver strictly
3. **Keep a CHANGELOG**: Document all changes between versions
4. **Tag releases in git**: Use git tags for version tracking
5. **Don't publish secrets**: Ensure `.npmignore` excludes sensitive files
6. **Document breaking changes**: Clearly communicate breaking changes in major versions
7. **Maintain backward compatibility**: In minor and patch versions

## Troubleshooting

### "You do not have permission to publish"
- Ensure you're logged in: `npm whoami`
- Check package name isn't taken: `npm view wizarding`
- Verify you have publish rights if it's a scoped package

### "Package name too similar to existing package"
- Choose a more unique name
- Consider using a scope: `@username/wizarding`

### Build fails before publish
- Check the `prepublishOnly` script runs successfully
- Ensure all dependencies are installed
- Verify TypeScript compilation succeeds

## Support

For issues with npm publishing:
- [npm Documentation](https://docs.npmjs.com/)
- [npm Support](https://www.npmjs.com/support)

For issues with the Wizarding package:
- [GitHub Issues](https://github.com/tommyo/wizarding/issues)