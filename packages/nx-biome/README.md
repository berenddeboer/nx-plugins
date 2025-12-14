# @berenddeboer/nx-biome

An Nx plugin for [Biome](https://biomejs.dev/) - a fast linter and formatter for JavaScript, TypeScript, JSON, and CSS. This plugin includes support for batch processing, which dramatically speeds up linting in monorepos.

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
  - [Plugin Setup](#plugin-setup)
  - [Basic Usage](#basic-usage)
  - [Batch Mode](#batch-mode-recommended-for-ci)
- [Configuration](#configuration)
- [License](#license)

## Features

- Self-inferring plugin that automatically adds lint targets to all projects
- Standard executor for single project linting
- **Batch executor for running Biome once across all affected projects** - massive performance improvement for large monorepos
- Caching support for faster subsequent runs

## Install

<details open>
<summary>npm</summary>

```sh
npm install --save-dev @berenddeboer/nx-biome
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add --save-dev @berenddeboer/nx-biome
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add --dev @berenddeboer/nx-biome
```

</details>

<details>
<summary>bun</summary>

```sh
bun add -D @berenddeboer/nx-biome
```

</details>

## Usage

### Plugin Setup

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

### Biome Configuration

This plugin expects a `biome.json` or `biome.jsonc` configuration file at the workspace root or in individual project directories. See the [Biome configuration documentation](https://biomejs.dev/reference/configuration/) for details.

### Caching

The plugin configures Nx caching with appropriate inputs:

- Project-level `biome.json` / `biome.jsonc`
- Workspace-level `biome.json` / `biome.jsonc`
- Source files: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.json`, `*.jsonc`, `*.css`, `*.md`

This ensures the cache is invalidated when relevant files change.

## Contributing

See [the contributing file](../../CONTRIBUTING.md)!

PRs accepted.

## License

This project is MIT licensed.
