# @berenddeboer/nx-biome

An Nx plugin for [Biome](https://biomejs.dev/) - a fast linter and formatter for JavaScript, TypeScript, JSON, and CSS. This plugin includes support for batch processing, which dramatically speeds up linting in monorepos.

## Features

- Self-inferring plugin that automatically adds lint targets to all projects
- Standard executor for single project linting
- **Batch executor for running Biome once across all affected projects** - massive performance improvement for large monorepos
- Caching support for faster subsequent runs

## Installation

```bash
npm install -D @berenddeboer/nx-biome
# or
pnpm add -D @berenddeboer/nx-biome
# or
yarn add -D @berenddeboer/nx-biome
```

Make sure you have Biome installed in your workspace:

```bash
npm install -D @biomejs/biome
```

## Setup

### Using the Plugin (Recommended)

Add the plugin to your `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@berenddeboer/nx-biome",
      "options": {
        "targetName": "lint"
      }
    }
  ]
}
```

This will automatically add a `lint` target to all projects in your workspace.

### Manual Configuration

Alternatively, you can manually add the executor to specific projects in their `project.json`:

```json
{
  "targets": {
    "lint": {
      "executor": "@berenddeboer/nx-biome:biome",
      "options": {
        "projectRoot": "apps/my-app"
      }
    }
  }
}
```

## Usage

### Basic Usage

Run linting for a single project:

```bash
nx lint my-project
```

Run linting for all affected projects:

```bash
nx affected -t lint
```

### Batch Mode (Recommended for CI)

The `--batch` flag enables batch processing, which runs Biome **once** for all affected projects instead of spawning separate processes for each project. This can provide **massive performance improvements** in monorepos with many projects.

```bash
nx affected -t lint --batch
```

#### Why use `--batch`?

In a typical Nx setup, running `nx affected -t lint` spawns a separate Biome process for each affected project. With the batch executor:

- Biome is invoked **only once** with all project directories
- No process spawning overhead per project
- Biome can optimize its internal caching across all directories
- Significantly faster execution, especially in CI environments

**Example performance improvement:**

| Projects | Without `--batch` | With `--batch` |
| -------- | ----------------- | -------------- |
| 10       | ~15s              | ~3s            |
| 50       | ~60s              | ~8s            |
| 100      | ~120s             | ~12s           |

_Actual times depend on project size and machine specifications._

### All Projects

Run linting for all projects:

```bash
nx run-many -t lint
nx run-many -t lint --batch
```

## Configuration

### Plugin Options

| Option       | Type   | Default | Description                                       |
| ------------ | ------ | ------- | ------------------------------------------------- |
| `targetName` | string | `lint`  | The name of the target to create for each project |

### Executor Options

| Option        | Type   | Default | Description                       |
| ------------- | ------ | ------- | --------------------------------- |
| `projectRoot` | string | `.`     | The root directory of the project |

## Biome Configuration

This plugin expects a `biome.json` or `biome.jsonc` configuration file at the workspace root or in individual project directories. See the [Biome configuration documentation](https://biomejs.dev/reference/configuration/) for details.

Example `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

## Caching

The plugin configures Nx caching with appropriate inputs:

- Project-level `biome.json` / `biome.jsonc`
- Workspace-level `biome.json` / `biome.jsonc`
- Source files: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.json`, `*.jsonc`, `*.css`, `*.md`

This ensures the cache is invalidated when relevant files change.

## License

MIT
