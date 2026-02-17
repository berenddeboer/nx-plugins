# @berenddeboer/nx-knip

A self-inferring Nx plugin for [Knip](https://knip.dev/) - find unused dependencies, exports, and files in your JavaScript/TypeScript projects.

## Install

Install both the plugin and knip:

<details open>
<summary>npm</summary>

```sh
npm install --save-dev @berenddeboer/nx-knip knip
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add --save-dev @berenddeboer/nx-knip knip
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn add --dev @berenddeboer/nx-knip knip
```

</details>

<details>
<summary>bun</summary>

```sh
bun add -D @berenddeboer/nx-knip knip
```

</details>

## Usage

### Plugin Setup

Add the plugin to your `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@berenddeboer/nx-knip",
      "options": {
        "targetName": "knip"
      }
    }
  ]
}
```

This will automatically add a `knip` target to all projects in your workspace.

### Running Knip

Run knip for a single project:

```bash
nx knip my-project
```

Run knip for all affected projects:

```bash
nx affected -t knip
```

Or run it for all projects:

```bash
nx run-many -t knip
```

## Executor Options

### `strict`

Enable [strict mode](https://knip.dev/features/production-mode#strict-mode) (implies `--production`). Defaults to `false`. When enabled, knip will:

- Verify isolation: workspaces should use strictly their own dependencies
- Include `peerDependencies` when finding unused or unlisted dependencies
- Report type-only imports listed in `dependencies`

You can enable it for all projects via the plugin options in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@berenddeboer/nx-knip",
      "options": {
        "targetName": "knip",
        "strict": true
      }
    }
  ]
}
```

Or per-project in `project.json`:

```json
{
  "targets": {
    "knip": {
      "options": {
        "strict": true
      }
    }
  }
}
```

### `env`

Set environment variables for the knip process. This is useful when knip loads `.ts` files that throw on missing environment variables - you can provide dummy values so knip can analyze the files without errors.

Configure via `targetDefaults` in `nx.json`:

```json
{
  "targetDefaults": {
    "knip": {
      "options": {
        "env": {
          "SQLITE_DATABASE_PATH": "/tmp/knip-dummy.db",
          "PF_ORG": "examples/demo"
        }
      }
    }
  }
}
```

Or per-project in `project.json`:

```json
{
  "targets": {
    "knip": {
      "options": {
        "env": {
          "DATABASE_URL": "postgres://localhost/dummy"
        }
      }
    }
  }
}
```

The provided environment variables are merged with the current `process.env`, so existing variables are preserved and the specified ones are added or overridden.

## How it works

This plugin runs `knip --workspace {projectRoot}` from the workspace root for each project. This means:

1. It uses the `--workspace` flag to focus on a specific workspace
2. The workspace root `knip.json` configuration is used
3. If [Bun](https://bun.sh) is installed, the plugin automatically uses `knip-bun` for significantly better performance

## Learn More

- [Knip Documentation](https://knip.dev/)
- [Nx Plugins](https://nx.dev/concepts/nx-plugins)
