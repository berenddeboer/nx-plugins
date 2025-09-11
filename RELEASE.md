# Release Process

This document outlines the process for releasing packages using GitHub Actions with NPM OIDC Trusted Publishing.

## Prerequisites

### NPM Trusted Publishing Setup

For each package, you must configure NPM Trusted Publishing on npmjs.com:

1. Go to [npmjs.com](https://npmjs.com) and log in
2. Navigate to each package:
   - `@berenddeboer/nx-aws-cdk`
   - `@berenddeboer/nx-sst`
3. Go to **Settings** → **Publishing Access**
4. Click **Add Trusted Publisher**
5. Select **GitHub Actions**
6. Configure with these values:
   - **Organization/User**: `berenddeboer`
   - **Repository**: `nx-plugins`
   - **Workflow file**: `publish.yml`
   - **Environment name**: Leave empty (optional)

### Required Permissions

The GitHub Actions workflow requires these permissions:

- `contents: write` - To push version tags and commits
- `id-token: write` - To generate OIDC tokens for NPM publishing

## Release Process

### Automated Release via GitHub Actions

1. Go to the **Actions** tab in GitHub
2. Select the **Publish** workflow
3. Click **Run workflow**
4. Choose the version bump type:
   - **patch**: Bug fixes (0.0.x)
   - **minor**: New features (0.x.0)
   - **major**: Breaking changes (x.0.0)
   - **prerelease**: Alpha/beta versions (0.0.x-alpha.0)
5. Click **Run workflow**

The workflow will:

- Install dependencies
- Run tests and linting for affected packages
- Version affected packages using conventional commits
- Build packages for publishing
- Publish to NPM using OIDC (no tokens required)
- Push version tags to Git
- Create GitHub releases

### What Gets Published

Only **affected packages** are published. The workflow uses:

```bash
nx affected --target=version --releaseAs=<version-type>
```

This means:

- Only packages that have changes since the last release are versioned and published
- Unchanged packages are skipped automatically
- Each package maintains independent versioning

### Security Features

- **No NPM tokens required**: Uses OIDC for secure authentication
- **Automatic provenance**: NPM automatically generates provenance attestations
- **Workflow-specific credentials**: Each publish uses ephemeral, workflow-specific tokens
- **Optional Nx Cloud integration**: Can enable distributed task execution (paid feature)

### Manual Release (Fallback)

If needed, you can release manually:

1. Install dependencies: `pnpm install`
2. Version packages: `pnpm nx affected --target=version --releaseAs=patch`
3. Build packages: `pnpm nx affected --target=build`
4. Manually publish from `dist/packages/<package-name>`: `npm publish --access public --provenance`

## Troubleshooting

### OIDC Authentication Errors

If you see authentication errors:

1. Verify NPM Trusted Publishing is configured correctly
2. Ensure the workflow filename matches exactly (`publish.yml`)
3. Check that the repository name is correct (`berenddeboer/nx-plugins`)
4. Verify the package exists on npmjs.com

### No Packages Published

If no packages are published:

- Check if there are actual changes since the last release
- Review the "affected" detection by running: `nx show projects --affected --base=HEAD~1`
- Ensure packages have been built successfully

### Version Conflicts

If versioning fails:

- Check for uncommitted changes in the repository
- Verify Git configuration is correct
- Ensure the base branch (main) is up to date

## Package Information

### @berenddeboer/nx-aws-cdk

- **Current version**: 3.0.1
- **Description**: Nx self-inferring plugin for AWS CDK stacks
- **NPM**: https://www.npmjs.com/package/@berenddeboer/nx-aws-cdk

### @berenddeboer/nx-sst

- **Current version**: 0.14.0
- **Description**: Nx plugin for Serverless Stack apps
- **NPM**: https://www.npmjs.com/package/@berenddeboer/nx-sst

## Conventional Commits

This project uses conventional commits for automatic versioning:

- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `feat!:` or `BREAKING CHANGE:` → Major version bump
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` → Patch version bump

Example commit messages:

```
feat(nx-aws-cdk): add support for CDK v2.150.0
fix(nx-sst): resolve SST configuration detection
docs: update README with new examples
```
