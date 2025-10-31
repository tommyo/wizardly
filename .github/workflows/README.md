# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Wizarding package.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

**What it does:**
- Tests on Node.js versions 20 and 22 (matrix strategy)
- Runs linters (oxlint + eslint)
- Performs TypeScript type checking
- Runs unit tests with Vitest
- Runs e2e tests with Playwright
- Builds the package
- Verifies package contents with dry-run

**Purpose:** Ensures code quality and prevents breaking changes from being merged.

### 2. Publish Workflow (`publish.yml`)

**Triggers:**
- Push of version tags matching pattern `v*.*.*` (e.g., `v1.0.0`, `v2.1.3`)

**What it does:**
1. Runs full test suite (linting, type checking, unit tests, e2e tests)
2. Builds the package
3. Verifies package contents
4. Publishes to npm with provenance
5. Creates a GitHub release with auto-generated release notes

**Purpose:** Automates the npm publishing process with full quality checks.

## Setup Instructions

### Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **npm Access Token**: Generate an automation token from your npm account
3. **GitHub Repository**: Admin access to configure secrets

### Step-by-Step Setup

#### 1. Generate npm Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click your profile icon → "Access Tokens"
3. Click "Generate New Token" → "Classic Token"
4. Select **"Automation"** type (required for CI/CD)
5. Give it a descriptive name (e.g., "GitHub Actions - Wizarding")
6. Copy the generated token (you won't see it again!)

#### 2. Add Token to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **"Add secret"**

#### 3. Verify Permissions

The workflows require these permissions (already configured):
- `contents: read` - Read repository contents
- `id-token: write` - Generate provenance (publish workflow only)

## Usage

### Running CI Checks

CI runs automatically on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

No manual action needed!

### Publishing a New Version

1. **Update the version** in `package.json`:
   ```bash
   npm version patch  # for bug fixes (1.0.0 → 1.0.1)
   npm version minor  # for new features (1.0.0 → 1.1.0)
   npm version major  # for breaking changes (1.0.0 → 2.0.0)
   ```

2. **Push the tag** to GitHub:
   ```bash
   git push origin v1.0.1  # replace with your actual version
   ```

3. **Monitor the workflow**:
   - Go to the "Actions" tab in your GitHub repository
   - Watch the "Publish to npm" workflow run
   - If successful, your package will be published to npm
   - A GitHub release will be created automatically

### Publishing Pre-release Versions

For beta/alpha versions:

```bash
# Update to pre-release version
npm version 1.1.0-beta.0

# Push the tag
git push origin v1.1.0-beta.0
```

The workflow will publish with the version tag from `package.json`.

## Workflow Features

### Security

- **npm Provenance**: Cryptographically links the published package to its source code and build process
- **Secrets Management**: npm token stored securely in GitHub Secrets
- **Minimal Permissions**: Workflows use least-privilege access

### Quality Assurance

- **Multi-Node Testing**: Tests on Node.js 20 and 22
- **Comprehensive Testing**: Unit tests, e2e tests, linting, type checking
- **Build Verification**: Ensures package builds successfully before publishing
- **Dry Run Check**: Verifies package contents before actual publish

### Automation

- **Automatic Releases**: GitHub releases created with auto-generated notes
- **Version Tagging**: Uses git tags for version control
- **Fail-Fast**: Stops on first error to prevent bad publishes

## Troubleshooting

### "Error: npm token not found"

**Solution**: Ensure you've added the `NPM_TOKEN` secret to your GitHub repository settings.

### "Error: You do not have permission to publish"

**Possible causes:**
1. npm token doesn't have publish permissions (use "Automation" type)
2. Package name already taken on npm
3. Token expired or revoked

**Solution**: Generate a new automation token and update the GitHub secret.

### "Tests failed"

**Solution**: The workflow prevents publishing if tests fail. Fix the failing tests locally and push again.

### "Version already published"

**Solution**: You cannot republish the same version. Update the version number in `package.json` and create a new tag.

### Workflow doesn't trigger

**Possible causes:**
1. Tag doesn't match pattern `v*.*.*`
2. Tag not pushed to GitHub

**Solution**: Ensure tag format is correct (e.g., `v1.0.0`) and push with `git push origin <tag-name>`.

## Best Practices

1. **Test Locally First**: Run `npm run build` and `npm run test:unit` before pushing tags
2. **Semantic Versioning**: Follow [semver](https://semver.org/) strictly
3. **Meaningful Commits**: Write clear commit messages for auto-generated release notes
4. **Review Changes**: Check the GitHub Actions logs after publishing
5. **Monitor npm**: Verify the package appears correctly on npmjs.com

## Manual Override

If you need to publish manually (bypassing GitHub Actions):

```bash
npm run build
npm publish --access public
```

Note: Manual publishing won't include provenance or automatic GitHub releases.

## Support

- **GitHub Actions Issues**: Check the Actions tab in your repository
- **npm Publishing Issues**: See [npm documentation](https://docs.npmjs.com/)
- **Package Issues**: Open an issue in the repository