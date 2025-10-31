# Publishing Guide for Wizardly

This guide explains how to publish the Wizardly package to npm.

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

# This creates a file like wizardly-1.0.0.tgz
# Install it in a test project:
cd /path/to/test-project
npm install /path/to/wizardly/wizardly-1.0.0.tgz
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

1. Check your package page: `https://www.npmjs.com/package/wizardly`
2. Try installing it in a test project:
   ```bash
   npm install wizardly
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
npm install wizardly@beta
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
npm unpublish wizardly@1.0.0

# Unpublish entire package (use with extreme caution)
npm unpublish wizardly --force
```

**Note**: Unpublishing is discouraged as it can break projects depending on your package. Use deprecation instead:

```bash
npm deprecate wizardly@1.0.0 "This version has a critical bug, please upgrade to 1.0.1"
```

## Automated Publishing with GitHub Actions (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then add your npm token to GitHub repository secrets as `NPM_TOKEN`.

## Package Scope (Optional)

If you want to publish under a scope (e.g., `@tommyo/wizardly`):

1. Update `package.json`:
   ```json
   {
     "name": "@tommyo/wizardly"
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
- Check package name isn't taken: `npm view wizardly`
- Verify you have publish rights if it's a scoped package

### "Package name too similar to existing package"
- Choose a more unique name
- Consider using a scope: `@username/wizardly`

### Build fails before publish
- Check the `prepublishOnly` script runs successfully
- Ensure all dependencies are installed
- Verify TypeScript compilation succeeds

## Support

For issues with npm publishing:
- [npm Documentation](https://docs.npmjs.com/)
- [npm Support](https://www.npmjs.com/support)

For issues with the Wizardly package:
- [GitHub Issues](https://github.com/tommyo/wizardly/issues)