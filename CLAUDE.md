# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Nx workspace containing two custom Nx plugins for cloud infrastructure development:

- **@berenddeboer/nx-aws-cdk**: Self-inferring Nx plugin for AWS CDK v2 applications
- **@berenddeboer/nx-sst**: Nx plugin for Serverless Stack (SST) v2 applications

## Development Commands

### Testing

```bash
# Test specific plugin
pnpm run test nx-aws-cdk
pnpm run test nx-sst

# Run tests using Nx directly
pnpm nx test nx-aws-cdk
pnpm nx test nx-sst
```

### Building

```bash
# Build specific plugin
pnpm run build:aws-cdk
pnpm run build:sst

# Build using Nx directly
pnpm nx build nx-aws-cdk
pnpm nx build nx-sst
```

### Linting and Formatting

```bash
# Lint specific plugin
pnpm run lint            # Lints nx-aws-cdk by default
pnpm nx lint nx-aws-cdk
pnpm nx lint nx-sst

# Format code
pnpm run format          # Formats uncommitted files
pnpm nx format:write --uncommitted
```

### End-to-End Testing

```bash
pnpm run e2e
```

### Local Testing of Plugins

After building a plugin, you can test it locally:

1. Build the plugin: `pnpm run build:aws-cdk` or `pnpm run build:sst`
2. Navigate to build output: `cd dist/packages/{plugin-name}`
3. Link for local testing: `pnpm link`
4. In target project: `pnpm link @berenddeboer/{plugin-name}`

## Architecture

### Project Structure

- `packages/nx-aws-cdk/`: AWS CDK plugin source code
- `packages/nx-sst/`: SST plugin source code
- `e2e/`: End-to-end tests
- `dist/`: Build output directory

### Plugin Architecture

Both plugins follow standard Nx plugin patterns:

**Generators**: Create new applications/projects

- `nx-aws-cdk`: `init` (hidden) and `application` generators
- `nx-sst`: `init` (hidden) and `app` generators

**Executors**: Run tasks on projects

- `nx-aws-cdk`: `cdk` executor for CDK commands
- `nx-sst`: `sst` executor for SST commands

**Plugin System**: Both use Nx's self-inferring plugin capabilities

- `nx-aws-cdk`: Auto-detects projects with `cdk.json` and creates targets (deploy, destroy, diff, etc.)
- `nx-sst`: Provides SST-specific executors and generators

### Key Files

- `generators.json`: Defines available generators
- `executors.json`: Defines available executors
- `src/plugins/plugin.ts`: Plugin inference logic (nx-aws-cdk)
- `src/index.ts`: Plugin entry point

## Development Notes

### Dependencies

- Uses Nx 20.6.4 with TypeScript 5.8.2
- AWS CDK plugin requires `@nx/devkit` and `@nx/eslint` as peer dependencies
- SST plugin requires `@nx/devkit` as peer dependency

### Testing Framework

- Uses Jest for unit testing
- Has dedicated e2e test structure

### Code Quality

- ESLint for linting with TypeScript support
- Prettier for formatting
- Husky for git hooks with lint-staged
- Commitlint with conventional commits

### Publishing

Packages are published to npm under `@berenddeboer/` scope:

- Manual publishing process from `dist/packages/{plugin}` directory
- Version management in individual package.json files
